# Travel Planner

Aplicatie web pentru luarea deciziilor de vacanta folosind metode stiintifice de analiza multi-criteriala (MCDA), cu vizualizare pe harta si planificator de calatorii.

## Functionalitati

- **Analiza multi-criteriala** — alege destinatia perfecta pe baza criteriilor tale (buget, vreme, activitati etc.) folosind 3 metode combinate:
  - Weighted Sum Model (WSM)
  - TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)
  - AHP (Analytic Hierarchy Process)
- **Harti interactive** — calculeaza rute reale intre destinatii cu OpenRouteService, optimizare KNN pentru ordinea optima a punctelor, fallback Haversine cand API-ul nu raspunde
- **Calendar de calatorii** — planifica vacante cu countdown automat pana la urmatoarea
- **Analize salvate + sabloane** — salveaza un set complet de criterii/scoruri si reincarca-l mai tarziu, sau foloseste sabloane predefinite (Buget, Familie, Aventura, Romantic, Cultural)
- **Profil personalizat** — schimba numele afisat in interfata
- **Cache local pentru rute** — rutele calculate sunt salvate 7 zile in localStorage pentru a economisi din cota API
- **Export raport** — print/PDF al rezultatelor cu stylesheet dedicat

## Tehnologii

- **React 19** + **React Router 7**
- **Vite 7** — build tool
- **Leaflet** + **react-leaflet** — harti
- **OpenRouteService API** — rute reale
- **localStorage** — persistenta locala (zero backend)
- CSS pur cu variabile (paleta violet)
- Font: Inter

## Instalare

```bash
npm install
cp .env.example .env
# editeaza .env si adauga cheia ta OpenRouteService
npm run dev
```

Iti faci cont gratuit pe [openrouteservice.org](https://openrouteservice.org/dev/#/signup) si copiezi cheia in `.env` la `VITE_ORS_API_KEY`.

## Scripts

```bash
npm run dev      # dev server pe localhost:5173
npm run build    # production build in dist/
npm run preview  # preview production build
npm run lint     # eslint
```

## Deploy

Aplicatia e SPA pura, deploy pe orice host static:

- **Netlify**: foloseste `public/_redirects` (deja inclus)
- **Vercel**: foloseste `vercel.json` (deja inclus)
- Seteaza `VITE_ORS_API_KEY` ca env var pe platforma de hosting

## Structura

```
src/
├── App.jsx              # routing + state global
├── components/          # ErrorBoundary, PageLoader, formulare
├── pages/
│   ├── InputPage.jsx    # formular locatii + criterii + scoruri
│   ├── ResultsPage.jsx  # analiza si recomandare
│   ├── MapsPage.jsx     # harta + routing (lazy loaded)
│   ├── CalendarPage.jsx # planificator vacante
│   └── SavedPage.jsx    # analize salvate + sabloane
└── App.css              # toate stilurile
```
