// Top ~1500 most common English words — used to boost spellcheck suggestion ranking.
// Words NOT in this list get a ranking penalty, pushing rare words like "waxy" below "lazy".

const EN_COMMON = new Set(`
the be to of and a in that have i it for not on with he as you do at this but his by from they we
say her she or an will my one all would there their what so up out if about who get which go me
when make can like time no just him know take people into year your good some could them see
other than then now look only come its over think also back after use two how our work first
well way even new want because any these give day most us is are was were been has had did got
got let may might must shall should need dare

able about above accept according across act actually add after again against age ago agree
ahead air all allow almost along already also always among amount an and another answer any
anyone anything appear apply area arm around arrive art ask at away

back bad base be beat beautiful because become bed before begin behind believe below best better
between big bit black blood blue board body book both boy break bring brother build business buy

call came can car care carry case catch cause center certain chance change check child children
choice choose city class clear close cold come common community company consider contain continue
control could country course court cover create cut

dark daughter day dead deal death decide deep describe develop die different difficult dinner
direction discover do doctor dog door down draw dream drive drop during

each early earth east eat effect eight either else end enough even evening ever every example
expect experience eye

face fact fall family far fast father feel feet few field fight fill final find fine finger
finish fire first five floor fly follow food foot for force foreign forget form four free friend
from front full

game garden general get girl give glass go god gold gone good great green ground group grow

hair half hand hang happen happy hard have he head hear heart heat heavy help her here high him
his hit hold home hope hot house how however hundred hundred husband

idea if important in include increase interest into is issue it its

job join just

keep key kid kill kind king kitchen know

land language large last late laugh lay lead learn leave left less let letter level lie life
light like line list listen little live long look lose lost lot love low

machine main make man many market may me mean meet member memory men might mind minute miss
money month more morning most mother mouth move much music must my

name national nature near necessary need never new news next nice night no none nor north not
note nothing now number

of off offer office often old on once one only open or order other our out outside over own

page paper part pass past pay people per perhaps period person picture piece place plan plant
play please point poor position possible power president problem produce program provide public
pull push put

question quite

raise reach read ready real really reason receive record red remember report rest result return
right rise road room run

same say school sea second see seem sell send serve set seven several shall share she short
should show side simple since sister sit situation six size small so some son soon sort sound
south speak special stand start state stay step still stop story strong student study such
suggest summer sun support sure system

table take talk tell ten test than thank that the their them then there these they thing think
third this those though thought three through time to today together too top toward town tree
turn two type

under understand until up upon us use usually

value very voice

wait walk wall want war watch water way we week well west what when where which while white who
whole why wide wife will win window wish with without woman wonder word work world would write
wrong

year yes yet you young your

again already always another away back before better between both came change close come could
country course day different does done down each end enough even every face family far few find
first follow food four from get give good great had hand hard has have head help here high him
home house how however

just keep kind large last late left less let life light like line little long look
made make many may mean might mind more most move much must name need never next night nothing
now number off often old only open order other our own part people place point put quite
read real right run same see seem set should show side since small some something sometimes
still such take tell than then there thing think this time too turn under until up us use
very want water way well what when where while who will with without word work world would
year young

angry bad basic beautiful best better big black blue born bought bright broken brown busy
calm careful cheap clean clear clever cold cool correct crazy cute daily dangerous dark
deep dirty dry early easy empty enough entire equal evil expensive extra fair famous fast
fat final flat free fresh friendly front frozen funny gentle global golden green grey guilty
happy healthy heavy helpful honest hot huge hungry hurt ill important impossible interesting
key kind known lady large late latest lazy left legal light likely live local lonely lost loud
lovely lucky main male married massive mental middle military modern narrow native natural
neat negative normal obvious odd official opposite ordinary original outside overall perfect
physical plain pleasant plenty poor popular positive possible powerful pretty private proper
proud pure quick quiet rare raw ready recent regular related rich rough round royal rude sad
safe secret secure serious severe sharp sharp short sick silly silver single slight slow smart
smooth soft solid special specific stable standard steady strange strict strong stupid sudden
super sweet tall terrible thick thin tiny tired top total tough traditional typical ugly unable
unfair unique unlikely upper upset useful usual vast warm weak wealthy weird welcome western whole
wild willing wise wonderful wooden worth worthy yellow

able above accept across address agree ahead allow amount angry animal answer apart apply
attempt attention avoid aware baby balance bank bar basic bathroom became becoming began
below benefit beyond billion block boat bone border bottle brain breast bright broken budget
bunch burn button calm camp campaign capital careful carry catch caught cell chain chair
challenge charge cheap chest chicken circle citizen claim clearly climate clinical club coach
collect column comfortable comment commercial compare complain complex concern condition conduct
conference confirm connect conscious contain correct count county couple coverage credit crisis
critical crowd cultural currency cycle dangerous debate decade deeply defense deliver demand
department deposit desire destroy detail determine device dimension direct director disappear
discover display dollar domestic double doubt dozen drama dress drink eastern economic editor
effective electric element eliminate emergency emotional emphasis employ empty encourage engage
engineer entirely entry environmental episode equal escape essential establish estimated evening
eventually evidence evil examine executive exercise existence expand expense expert explain
expose extend extreme fairly familiar fashion feature federal financial flag flight folk football
forever formal former fourth frame freedom fuel function gain gap gather generation goal golden
grab grade grand guarantee guard handle harmful headquarters healthy heaven helpful highly
household ignore illegal image imagine impact impose impressive incident influence initial
injury inner innocent inside instance institution intend internal investigation investor
Jewish junior jury largely launch lawn lawyer league literally logical loss lots loud lover
manufacturer march massive math mayor meanwhile measurement mechanism medicine mental merely
ministry minority miracle mixture monitor moral mortgage mountain mystery naked narrative nerve
nonetheless notion novel nurse observer occasion odd offensive ongoing opening opponent original
otherwise overcome pace pack pain pair participant partly partner passenger peer percent
perform permission perspective phase photograph phrase pile pilot pitch plenty plot pocket poll
portion poverty prayer precisely primarily prime principal priority proceed proper protest
psychological publicly purely pursue qualify quote rain rapid rare reaction reform region
reject relative relief religious repeat replace republic requirement resolution resolve resort
resource respond retire revenue review revolution rice ring rural safety salary salt sand satisfy
sauce scared schedule scientific scope search secondary seek senator senior sentence setting
severe shadow shall shelter shift shout shut silver sin skip sleep slightly slip smoke solution
soul spanish specimen spirit spread squeeze stability steal stem stimulate stomach strategic
strike submit substantial sufficient suit super surely survival switch sympathy talent tap
temporary tension theme therapy thick threat throat tired tissue tobacco tolerance tone tongue
tower track tradition traffic transfer translate transportation treaty trend trial trick
troop truck truly trust twin typical ultimately unfortunately uniform unique universe unlike
urban vacation valley vast victim violence virtually virtue visible vital volume voluntary
wage weak wealth weapon weather wedding weekly welfare western whereas willing wooden
worker worried yellow
`.trim().split(/\s+/))

// Top ~800 most common Danish words
const DA_COMMON = new Set(`
og i at er det en til på den for med har af ikke der var kan jeg som et vil om fra han
de sig så hun men blev ud nu sin hvad over da også efter alt man mange dem kun blive til
noget andre gøre hele jo ned har hele igen godt lidt mere end os selv engang gik aldrig
her sige skal stå igen hende kom derfor disse ind sit tage fordi sted hver anden kunne
lille under nogen set nu ved side sine store mellem mod havde disse sidste allerede
altid anden gang anden arbejde del faktisk finde første folk gennem gerne give gå gøre
ham hen hjem hvis havde hører inden komme lad lang lejlighed leve lige lokal lov mand
mange mennesker meget mod morgen mål måske nede nemlig noget nok ofte omkring oven
penge plads pludselig punkt rig rigtig sag sammen se simpelthen slet slags snart spørge
stadig stille synes tid tilbrig tit tro ud vej vel vente videre vigtig ville virke
virkelig vis vise være været år

af alle alt altid altså alligevel andre arbejde barn begynde behøve beholde bestemme
betyde blive bo bruge burde by byde bør dag del dem den denne der derefter derfor
des desuden det dette dine disse dog drage du dyr dø efter egen eksempel eller en end
endnu er falde far fejl fem fik finde flere fly folk for fordi forestille forsøge
fortælle fra fro fuld fylde først følge følge få ganske gerne give glad god gribe grund
gang gå gammel gøre ha ham han have hel heller hen hende hendes her herfra herhen
hermed herre hest hid hidtil hjem hjælpe holde hun hurtig hus hvem hver hverken hvid
hvile hvilken hvor hvordan hvorfor hvornår hænde høj hører håbe hånd i igen ikke ind
inden intet ja jeg kan kende klar klare komme konst kort krig kun kunne kvinde kære købe
køre lang langsom lave lede lide lidt lige lille lov lykke lægge længe længere løbe mad
magt mand mange med meget melde mellem men mens menneske midt mig min mindre mindst mod
mor morgen morsom meget mulig mund mærke mørk møde nabo nat nede nemlig netop ni nogen
noget ny nyde nær næsten nødt nå og også om omkring op otte over overfor part penge
pige plads pludselig punkt på rejse ret rige rigtig rolle rum ryg række sag sagde se
selv selvfølgelig side siden sig sige sin sit sjælden skal skole skridt skrive sky
slags slet slut slutte slå smuk snakke snart som sort sove spille spise sprog spørge
stakkels stadig starte sted stemme stille stol stor styre stærk stå sulten svare svær
synes sælge sætte søndag så tag tage tak tale tanke tid tidlig tidligere til tilbage
tilbyde tilfælde tillade tre trist tro tung tur type tælle tæt ud ude uden udenom udenfor
uger umulig under ung undskyld ung unge vand var vej vel vende vente verden vi vid vide
vigtig vil vild ville vinde virke virkelig vis vise vælge vær være værelse værd vænne
yderligere øjeblik ønske øverst år årsag
`.trim().split(/\s+/))

export function isCommonWord(word: string, lang: 'en_US' | 'da_DK'): boolean {
  const lower = word.toLowerCase()
  return lang === 'da_DK' ? DA_COMMON.has(lower) : EN_COMMON.has(lower)
}
