# BGP landingspagina (aanbod.bgpedelmetaal.nl)

Statische landingspagina voor betaald verkeer, gehost op GitHub Pages.

- `index.html` landingspagina, `bedankt.html` bedanktpagina (conversie-event `lead_submit`)
- Formulier post naar Make-webhook, scenario "BGP - LP aanbod.bgpedelmetaal.nl - aanvraag → mail Douglas" (map BGP, team Pro Active)
- Tracking: GTM-ID invullen in `tracking.js` (staat nu op GTM-XXXXXXX, dan laadt er niets)
- Klantquotes en btw-vraag staan uit met `hidden`, pas aanzetten na toestemming en fiscale toets
- `CNAME` niet verwijderen, anders valt het subdomein weg
