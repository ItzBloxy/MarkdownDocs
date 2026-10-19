import { useState, useEffect, useRef, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import Typo from 'typo-js'
import { isCommonWord } from '../utils/commonWords'

export type SpellcheckLanguage = 'en_US' | 'da_DK' | 'none'

const DICT_BASE = 'https://cdn.jsdelivr.net/gh/wooorm/dictionaries@main/dictionaries'

const LANG_URLS: Record<SpellcheckLanguage, { aff: string; dic: string }> = {
  en_US: {
    aff: `${DICT_BASE}/en/index.aff`,
    dic: `${DICT_BASE}/en/index.dic`,
  },
  da_DK: {
    aff: `${DICT_BASE}/da/index.aff`,
    dic: `${DICT_BASE}/da/index.dic`,
  },
}

interface MisspelledWord {
  from: number
  to: number
  word: string
}

export interface SpellcheckState {
  language: SpellcheckLanguage
  loading: boolean
  misspelledAt: MisspelledWord | null // word under cursor for context menu
  suggestions: string[]
}

const spellPluginKey = new PluginKey('spellcheck')

const WORD_REGEX = /[a-zA-ZæøåÆØÅéèêëüöäïîôâûàùçñ]+(?:'[a-zA-Z]+)?/g

// Damerau-Levenshtein distance — handles transpositions (laxy→lazy = 1)
function damerauLevenshtein(a: string, b: string): number {
  const la = a.length, lb = b.length
  if (la === 0) return lb
  if (lb === 0) return la

  const d: number[][] = Array.from({ length: la + 1 }, () => Array(lb + 1).fill(0))
  for (let i = 0; i <= la; i++) d[i][0] = i
  for (let j = 0; j <= lb; j++) d[0][j] = j

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // deletion
        d[i][j - 1] + 1,       // insertion
        d[i - 1][j - 1] + cost // substitution
      )
      // transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost)
      }
    }
  }
  return d[la][lb]
}

// Keyboard layout adjacency for tiebreaking
const KEYBOARD_NEIGHBORS: Record<string, string> = {
  q: 'wa', w: 'qeas', e: 'wrds', r: 'etdf', t: 'ryfg', y: 'tugh', u: 'yijh', i: 'uokj', o: 'iplk', p: 'ol',
  a: 'qwsz', s: 'awedxz', d: 'serfcx', f: 'drtgvc', g: 'ftyhbv', h: 'gyujnb', j: 'huikmn', k: 'jiolm', l: 'kop',
  z: 'asx', x: 'zsdc', c: 'xdfv', v: 'cfgb', b: 'vghn', n: 'bhjm', m: 'njk',
}

function keyboardDistance(a: string, b: string): number {
  // Returns 0 if same, 0.1 if adjacent on keyboard, 0.5 otherwise
  if (a === b) return 0
  if (KEYBOARD_NEIGHBORS[a]?.includes(b)) return 0.1
  return 0.5
}

// Refined distance: DL distance + tiebreakers for smarter ranking
function refinedDistance(source: string, candidate: string): number {
  const dl = damerauLevenshtein(source, candidate)

  // Same-length, single substitution — use keyboard proximity as tiebreaker
  if (dl === 1 && source.length === candidate.length) {
    for (let i = 0; i < source.length; i++) {
      if (source[i] !== candidate[i]) {
        return dl + keyboardDistance(source[i], candidate[i])
      }
    }
    return dl
  }

  // Length-changing edits (deletion/insertion) — slight penalty
  // Users usually mean a same-length word with a typo, not a shorter/longer word
  if (dl === 1 && source.length !== candidate.length) {
    return dl + 0.3
  }

  return dl
}

// Common misspellings fallback — English
const EN_FIXES: Record<string, string> = {
  // Extremely common typos
  teh: 'the', hte: 'the', taht: 'that', thier: 'their', recieve: 'receive',
  wiht: 'with', whcih: 'which', becuase: 'because', langauge: 'language',
  adn: 'and', hsa: 'has', jsut: 'just', abuot: 'about', agian: 'again',
  ahve: 'have', cna: 'can', deos: 'does', dont: "don't", doesnt: "doesn't",
  dotn: "don't", hwat: 'what', nto: 'not', tow: 'two', ot: 'to', waht: 'what',
  wnat: 'want', yuo: 'you', yuor: 'your', thsi: 'this', htat: 'that',
  // Top 100 commonly misspelled words
  absense: 'absence', acheive: 'achieve', achievment: 'achievement',
  accomodate: 'accommodate', acommodate: 'accommodate', acheivment: 'achievement',
  acquaintence: 'acquaintance', acquit: 'acquit', acrage: 'acreage',
  adress: 'address', agressive: 'aggressive', allegience: 'allegiance',
  amature: 'amateur', aparent: 'apparent', arguement: 'argument',
  athiest: 'atheist', awfull: 'awful', basicly: 'basically',
  begining: 'beginning', beleive: 'believe', bellweather: 'bellwether',
  buisness: 'business', calender: 'calendar', camoflage: 'camouflage',
  catagory: 'category', cemetary: 'cemetery', changable: 'changeable',
  cheif: 'chief', collegue: 'colleague', collectable: 'collectible',
  comming: 'coming', commited: 'committed', commitee: 'committee',
  comparitive: 'comparative', concensus: 'consensus', concious: 'conscious',
  copywrite: 'copyright', dalyance: 'dalliance', decieve: 'deceive',
  definately: 'definitely', definatly: 'definitely', desparate: 'desperate',
  diffrence: 'difference', dilema: 'dilemma', disapear: 'disappear',
  disapoint: 'disappoint', disipline: 'discipline', embarass: 'embarrass',
  enviroment: 'environment', equiped: 'equipped', exagerate: 'exaggerate',
  excede: 'exceed', existance: 'existence', experiance: 'experience',
  familar: 'familiar', finaly: 'finally', firey: 'fiery',
  foriegn: 'foreign', fourty: 'forty', freind: 'friend', fulfil: 'fulfill',
  gaurd: 'guard', goverment: 'government', grammer: 'grammar',
  gratefull: 'grateful', garantee: 'guarantee', happend: 'happened',
  harrass: 'harass', heighth: 'height', heirarchy: 'hierarchy',
  humourous: 'humorous', hygene: 'hygiene', ignorence: 'ignorance',
  imaginery: 'imaginary', immediatly: 'immediately', incidently: 'incidentally',
  independant: 'independent', indispensible: 'indispensable',
  innoculate: 'inoculate', intellegent: 'intelligent',
  intresting: 'interesting', irresistable: 'irresistible',
  jewlery: 'jewelry', judgement: 'judgment', knowlege: 'knowledge',
  liesure: 'leisure', liason: 'liaison', libary: 'library',
  liscense: 'license', maintainance: 'maintenance', manuever: 'maneuver',
  medeval: 'medieval', memento: 'memento', millenium: 'millennium',
  minature: 'miniature', mischievious: 'mischievous', mispell: 'misspell',
  misspel: 'misspell', neccessary: 'necessary', necesary: 'necessary',
  neice: 'niece', nieghbor: 'neighbor', noticable: 'noticeable',
  occassion: 'occasion', occurence: 'occurrence', occured: 'occurred',
  ommision: 'omission', oppurtunity: 'opportunity', outragous: 'outrageous',
  parliment: 'parliament', pasttime: 'pastime', percieve: 'perceive',
  perseverence: 'perseverance', personell: 'personnel',
  playwrite: 'playwright', posession: 'possession', potatos: 'potatoes',
  preceed: 'precede', privelege: 'privilege', pronounciation: 'pronunciation',
  publically: 'publicly', questionaire: 'questionnaire',
  realy: 'really', reciept: 'receipt', reccomend: 'recommend',
  refered: 'referred', referance: 'reference', relevent: 'relevant',
  religous: 'religious', repitition: 'repetition', resturant: 'restaurant',
  rythm: 'rhythm', sacrilegious: 'sacrilegious', seize: 'seize',
  sentance: 'sentence', seperate: 'separate', sergent: 'sergeant',
  sieze: 'seize', similer: 'similar', sinceerly: 'sincerely',
  speach: 'speech', succesful: 'successful', supercede: 'supersede',
  suprise: 'surprise', temperture: 'temperature', tendancy: 'tendency',
  therefor: 'therefore', threshhold: 'threshold', tomatos: 'tomatoes',
  tommorow: 'tomorrow', tounge: 'tongue', truely: 'truly',
  tyrany: 'tyranny', underate: 'underrate', unfortunatly: 'unfortunately',
  unnecesary: 'unnecessary', untill: 'until', useable: 'usable',
  vaccuum: 'vacuum', vegatable: 'vegetable', vehical: 'vehicle',
  visious: 'vicious', wether: 'whether', wierd: 'weird',
  writting: 'writing', yeild: 'yield',
}

// Common misspellings fallback — Danish
const DA_FIXES: Record<string, string> = {
  adresse: 'adresse', // correct but often typed as "addresse"
  addresse: 'adresse', agresiv: 'aggressiv', aggresiv: 'aggressiv',
  anoce: 'annonce', annoncere: 'annoncere', bibliotek: 'bibliotek',
  chauffeur: 'chauffør', chaufør: 'chauffør', deffinere: 'definere',
  deffinition: 'definition', eksistere: 'eksistere', forretning: 'forretning',
  forrettning: 'forretning', garranti: 'garanti', garantie: 'garanti',
  hygejne: 'hygiejne', hygine: 'hygiejne', interesant: 'interessant',
  interesseret: 'interesseret', karierre: 'karriere', karrierre: 'karriere',
  kommunikation: 'kommunikation', kommunikere: 'kommunikere',
  konsekvent: 'konsekvent', kvittering: 'kvittering', matmatik: 'matematik',
  nødvendigt: 'nødvendigt', paralel: 'parallel', professer: 'professor',
  proffessor: 'professor', psykologie: 'psykologi', referance: 'reference',
  resturant: 'restaurant', rythme: 'rytme', sekrætær: 'sekretær',
  standart: 'standard', terasse: 'terrasse', uddanelse: 'uddannelse',
  vejledning: 'vejledning', igang: 'i gang', imorgen: 'i morgen',
  idag: 'i dag', iaften: 'i aften', igår: 'i går',
  selvfølgelig: 'selvfølgelig', selvfølgeligt: 'selvfølgelig',
  anullere: 'annullere', indikktion: 'indikation', sygehuset: 'sygehuset',
  millitær: 'militær', millioner: 'millioner',
}

// Merged misspellings (language is auto-detected by checking both)
const COMMON_FIXES: Record<string, string> = { ...EN_FIXES, ...DA_FIXES }

function getStoredLanguage(): SpellcheckLanguage {
  const stored = localStorage.getItem('markdowndocs-spell-lang')
  if (stored === 'en_US' || stored === 'da_DK' || stored === 'none') return stored
  return 'en_US'
}

export function useSpellcheck(editor: Editor | null) {
  const [language, setLanguageState] = useState<SpellcheckLanguage>(getStoredLanguage)
  const [loading, setLoading] = useState(false)
  const typoRef = useRef<Typo | null>(null)
  const ignoreListRef = useRef<Set<string>>(new Set())
  const customDictRef = useRef<Set<string>>(new Set())
  const misspelledWordsRef = useRef<MisspelledWord[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load custom dictionary from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('markdowndocs-custom-dict')
    if (stored) {
      try { customDictRef.current = new Set(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [])

  // Load dictionary
  const loadDictionary = useCallback(async (lang: SpellcheckLanguage) => {
    if (lang === 'none') {
      typoRef.current = null
      misspelledWordsRef.current = []
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const urls = LANG_URLS[lang]
      const [affResp, dicResp] = await Promise.all([
        fetch(urls.aff),
        fetch(urls.dic),
      ])
      const [affData, dicData] = await Promise.all([
        affResp.text(),
        dicResp.text(),
      ])
      typoRef.current = new Typo(lang, affData, dicData)
    } catch (e) {
      console.error('Failed to load dictionary:', e)
      typoRef.current = null
    }
    setLoading(false)
  }, [])

  // Load on mount and language change
  useEffect(() => {
    loadDictionary(language)
  }, [language, loadDictionary])

  const setLanguage = useCallback((lang: SpellcheckLanguage) => {
    setLanguageState(lang)
    localStorage.setItem('markdowndocs-spell-lang', lang)
    ignoreListRef.current.clear()
    if (lang === 'none' && editor) {
      misspelledWordsRef.current = []
      const { tr } = editor.state
      tr.setMeta(spellPluginKey, { misspelled: [] })
      editor.view.dispatch(tr)
    }
  }, [editor])

  const scanAbortRef = useRef<(() => void) | null>(null)

  // Scan document for misspelled words — deferred across idle frames
  const scanDocument = useCallback(() => {
    if (!editor || !typoRef.current) {
      misspelledWordsRef.current = []
      return
    }

    // Abort any in-progress scan
    scanAbortRef.current?.()

    const typo = typoRef.current
    const doc = editor.state.doc
    let aborted = false

    scanAbortRef.current = () => { aborted = true }

    // Collect all words to check first (fast — no dictionary calls)
    const wordQueue: { word: string; from: number; to: number }[] = []

    doc.descendants((node, pos) => {
      if (!node.isText) return
      if (node.marks.some(m => m.type.name === 'code')) return

      const text = node.text ?? ''
      let match: RegExpExecArray | null
      WORD_REGEX.lastIndex = 0

      while ((match = WORD_REGEX.exec(text)) !== null) {
        const word = match[0]
        if (word.length <= 1) continue
        if (ignoreListRef.current.has(word.toLowerCase())) continue
        if (customDictRef.current.has(word.toLowerCase())) continue
        wordQueue.push({
          word,
          from: pos + match.index,
          to: pos + match.index + word.length,
        })
      }
    })

    // Two-pass approach:
    // Pass 1 (fast): typo.check() only — mark all failed words immediately
    // Pass 2 (deferred): typo.suggest() filtering — remove words with no suggestions
    // This keeps the UI responsive since suggest() is the expensive call

    const results: MisspelledWord[] = []

    // Pass 1: fast check — runs in one frame (check() is cheap)
    for (const { word, from, to } of wordQueue) {
      if (!typo.check(word)) {
        // Fast path: if in COMMON_FIXES, definitely has suggestions
        if (COMMON_FIXES[word.toLowerCase()]) {
          results.push({ from, to, word })
        } else {
          // Needs suggest() verification — mark as pending
          results.push({ from, to, word, _pending: true } as MisspelledWord & { _pending?: boolean })
        }
      }
    }

    // Apply initial decorations immediately (all failed words underlined)
    if (!aborted && editor) {
      misspelledWordsRef.current = results
      const { tr } = editor.state
      tr.setMeta(spellPluginKey, { misspelled: results })
      editor.view.dispatch(tr)
    }

    // Pass 2: deferred suggest() filtering — one word per idle frame
    const pending = results.filter((r: any) => r._pending)
    let pendingIdx = 0

    const filterNext = () => {
      if (aborted || !editor) return
      if (pendingIdx >= pending.length) {
        scanAbortRef.current = null
        return
      }

      const word = pending[pendingIdx]
      pendingIdx++

      const hasSuggestions = typo.suggest(word.word).length > 0
      if (!hasSuggestions) {
        // Remove from results — no suggestions available
        const idx = misspelledWordsRef.current.indexOf(word)
        if (idx >= 0) {
          misspelledWordsRef.current = misspelledWordsRef.current.filter(w => w !== word)
          // Update decorations
          const { tr } = editor.state
          tr.setMeta(spellPluginKey, { misspelled: misspelledWordsRef.current })
          editor.view.dispatch(tr)
        }
      }

      // Schedule next word — yield after each suggest() call
      setTimeout(filterNext, 0)
    }

    // Start pass 2 after a short delay to let the UI breathe
    setTimeout(filterNext, 50)
  }, [editor])

  // Debounced scan on editor update
  useEffect(() => {
    if (!editor) return

    const handler = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(scanDocument, 500)
    }

    editor.on('update', handler)
    // Initial scan after dictionary loads
    if (typoRef.current && !loading) {
      setTimeout(scanDocument, 100)
    }

    return () => {
      editor.off('update', handler)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [editor, scanDocument, loading])

  // Re-scan when dictionary finishes loading
  useEffect(() => {
    if (!loading && typoRef.current) {
      scanDocument()
    }
  }, [loading, scanDocument])

  // Get misspelled word at a document position
  const getMisspelledAt = useCallback((pos: number): MisspelledWord | null => {
    return misspelledWordsRef.current.find(w => pos >= w.from && pos <= w.to) ?? null
  }, [])

  // Generate single-edit candidates and check which are real words
  const generateEditCandidates = useCallback((word: string): string[] => {
    if (!typoRef.current) return []
    const typo = typoRef.current
    const lower = word.toLowerCase()
    const results: string[] = []
    const seen = new Set<string>()
    const alphabet = 'abcdefghijklmnopqrstuvwxyzæøå'

    // Substitutions: replace each char with every letter
    for (let i = 0; i < lower.length; i++) {
      for (const c of alphabet) {
        if (c === lower[i]) continue
        const candidate = lower.slice(0, i) + c + lower.slice(i + 1)
        if (!seen.has(candidate) && typo.check(candidate)) {
          seen.add(candidate)
          results.push(candidate)
        }
      }
    }

    // Transpositions: swap adjacent chars
    for (let i = 0; i < lower.length - 1; i++) {
      const candidate = lower.slice(0, i) + lower[i + 1] + lower[i] + lower.slice(i + 2)
      if (!seen.has(candidate) && typo.check(candidate)) {
        seen.add(candidate)
        results.push(candidate)
      }
    }

    // Deletions: remove one char
    for (let i = 0; i < lower.length; i++) {
      const candidate = lower.slice(0, i) + lower.slice(i + 1)
      if (!seen.has(candidate) && candidate.length > 1 && typo.check(candidate)) {
        seen.add(candidate)
        results.push(candidate)
      }
    }

    // Insertions: add one char at each position
    for (let i = 0; i <= lower.length; i++) {
      for (const c of alphabet) {
        const candidate = lower.slice(0, i) + c + lower.slice(i)
        if (!seen.has(candidate) && typo.check(candidate)) {
          seen.add(candidate)
          results.push(candidate)
        }
      }
    }

    return results
  }, [])

  // Get suggestions for a word — re-ranked by Damerau-Levenshtein distance
  const getSuggestions = useCallback((word: string, limit = 5): string[] => {
    const lower = word.toLowerCase()
    const candidateSet = new Set<string>()

    // 1. Common misspellings (instant, highest priority)
    const commonFix = COMMON_FIXES[lower]
    if (commonFix) candidateSet.add(commonFix)

    // 2. Hunspell suggestions
    if (typoRef.current) {
      for (const s of typoRef.current.suggest(word)) {
        candidateSet.add(s.toLowerCase())
      }
    }

    // 3. Single-edit candidates (catches substitutions like laxy→lazy)
    for (const s of generateEditCandidates(word)) {
      candidateSet.add(s)
    }

    const candidates = [...candidateSet]
    if (candidates.length === 0) return []

    // Re-rank by refined distance + word frequency boost
    const scored = candidates.map(s => ({
      word: s,
      dist: refinedDistance(lower, s) + (isCommonWord(s, language) ? -0.4 : 0.2),
    }))
    scored.sort((a, b) => a.dist - b.dist)

    // Match original casing
    const results = scored.slice(0, limit).map(s => {
      if (word[0] === word[0].toUpperCase()) {
        return s.word[0].toUpperCase() + s.word.slice(1)
      }
      return s.word
    })

    return results
  }, [generateEditCandidates, language])

  // Replace a misspelled word with a suggestion
  const replaceWord = useCallback((from: number, to: number, replacement: string) => {
    if (!editor) return
    editor.chain().focus().insertContentAt({ from, to }, replacement).run()
  }, [editor])

  // Add word to custom dictionary (persisted)
  const addToDictionary = useCallback((word: string) => {
    customDictRef.current.add(word.toLowerCase())
    localStorage.setItem('markdowndocs-custom-dict', JSON.stringify([...customDictRef.current]))
    scanDocument()
  }, [scanDocument])

  // Ignore all instances for this session
  const ignoreAll = useCallback((word: string) => {
    ignoreListRef.current.add(word.toLowerCase())
    scanDocument()
  }, [scanDocument])

  // ProseMirror plugin for decorations
  const spellcheckPlugin = useCallback(() => {
    return new Plugin({
      key: spellPluginKey,
      state: {
        init() { return DecorationSet.empty },
        apply(tr, old, _oldState, newState) {
          const meta = tr.getMeta(spellPluginKey)
          if (meta?.misspelled) {
            const decos = (meta.misspelled as MisspelledWord[]).map(w =>
              Decoration.inline(w.from, w.to, { class: 'misspelled' })
            )
            return DecorationSet.create(newState.doc, decos)
          }
          if (tr.docChanged) {
            return old.map(tr.mapping, tr.doc)
          }
          return old
        },
      },
      props: {
        decorations(state) {
          return spellPluginKey.getState(state)
        },
      },
    })
  }, [])

  return {
    language,
    loading,
    setLanguage,
    getMisspelledAt,
    getSuggestions,
    replaceWord,
    addToDictionary,
    ignoreAll,
    spellcheckPlugin,
  }
}
