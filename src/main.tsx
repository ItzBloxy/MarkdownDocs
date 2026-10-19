import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts ship with the bundle so the desktop app keeps its type offline
import '@fontsource-variable/schibsted-grotesk'
import '@fontsource-variable/schibsted-grotesk/wght-italic.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
