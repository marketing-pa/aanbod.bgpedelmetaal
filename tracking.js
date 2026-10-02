/* =========================================================
   BGP landingspagina, tracking en Consent Mode v2
   Enige plek waar het GTM-ID staat. GA4, Google Ads-conversie
   en Meta pixel worden in Google Tag Manager ingesteld.
   ========================================================= */
var BGP_GTM_ID = 'GTM-58HPHF4V'; // zelfde container als www.bgpedelmetaal.nl

var BGP_CONSENT_KEY = 'bgp_consent_v1';
var BGP_CONSENT_MAX_DAYS = 365; // daarna opnieuw vragen

window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }

// 1. Standaard: alles wat niet noodzakelijk is staat uit
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  personalization_storage: 'denied',
  functionality_storage: 'denied',
  security_storage: 'granted',
  wait_for_update: 500
});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);

// 2. Eerder gemaakte keuze terugzetten, vóór GTM laadt
window.bgpConsent = (function(){
  function read(){
    try {
      var c = JSON.parse(localStorage.getItem(BGP_CONSENT_KEY) || 'null');
      if (!c || typeof c.ts !== 'number') return null;
      if (Date.now() - c.ts > BGP_CONSENT_MAX_DAYS * 864e5) return null;
      return c;
    } catch (e) { return null; }
  }
  function g(b){ return b ? 'granted' : 'denied'; }
  function signals(c){
    return {
      functionality_storage: g(c.preferences), personalization_storage: g(c.preferences),
      analytics_storage: g(c.statistics),
      ad_storage: g(c.marketing), ad_user_data: g(c.marketing), ad_personalization: g(c.marketing)
    };
  }
  // Zelfde gedrag als de hoofdsite: na een nieuwe keuze volgt het event 'consentUpdated'.
  // Bij een terugkerende bezoeker wordt de keuze stil hersteld, zonder event.
  function apply(c, isNew){
    gtag('consent', 'update', signals(c));
    if (isNew) dataLayer.push({ event: 'consentUpdated' });
  }
  function save(preferences, statistics, marketing){
    var c = { v: 1, ts: Date.now(), preferences: !!preferences, statistics: !!statistics, marketing: !!marketing };
    try { localStorage.setItem(BGP_CONSENT_KEY, JSON.stringify(c)); } catch (e) {}
    apply(c, true);
    return c;
  }
  var current = read();
  if (current) apply(current, false);
  return { get: function(){ return read(); }, save: save };
})();

// 3. GTM laden (pas als er een echt ID staat)
(function(){
  if (!/^GTM-[A-Z0-9]{4,}$/.test(BGP_GTM_ID) || BGP_GTM_ID === 'GTM-XXXXXXX') return;
  dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=' + BGP_GTM_ID;
  document.head.appendChild(s);
})();
