# BGP landingspagina (aanbod.bgpedelmetaal.nl)

Statische landingspagina voor betaald verkeer, gehost op GitHub Pages.

- `index.html` landingspagina, `bedankt.html` bedanktpagina (conversie-event `lead_submit`)
- Formulier post naar Make-webhook, scenario "BGP - LP aanbod.bgpedelmetaal.nl - aanvraag → mail Douglas" (map BGP, team Pro Active)
- Tracking: GTM-58HPHF4V (zelfde container als www.bgpedelmetaal.nl), Consent Mode v2, event `consentUpdated` na een keuze, zoals op de hoofdsite
- Klantquotes en btw-vraag staan uit met `hidden`, pas aanzetten na toestemming en fiscale toets
- `CNAME` niet verwijderen, anders valt het subdomein weg

## Update november 2026 (UX-audit, variant A)
- Formulier in de hero (desktop rechts, mobiel onder de hero), op alle schermen in twee stappen. Opties `aanvraag_type`: Kennismaken / Persoonlijk prijsvoorstel / Eerste partij aanbieden. Verplicht: bedrijfsnaam, naam, telefoon, e-mail. KvK en materiaal optioneel, geen privacyvinkje.
- Knoppen met `data-intent` vinken de juiste optie in het formulier aan.
- dataLayer-events: `form_view`, `form_start`, `form_intent`, `scroll_depth`, `video_view`, `video_play`, `video_pause`, `video_complete`, `lead_submit` (bedanktpagina). Klikken op knoppen dragen `data-cta`.
- Platformvideo: `assets/platform-rondleiding.mp4` (laadt pas in beeld, zonder geluid, met pauzeknop).
- Testscenario Make: "BGP - LP aanbod - TEST (kopie, mail alleen naar Magali)", staat uit. Aanzetten en de webhook-URL tijdelijk in een lokale kopie zetten om te testen zonder mail naar BGP.
