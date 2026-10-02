/* =========================================================
   BGP landingspagina, tracking
   Enige plek waar het GTM-ID staat. GA4, Google Ads-conversie
   en Meta pixel worden in Google Tag Manager ingesteld.
   ========================================================= */
var BGP_GTM_ID = 'GTM-XXXXXXX'; // <-- vervang door het echte container-ID

window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }

// Consent Mode v2: standaard alles geweigerd tot de bezoeker kiest
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);

(function(){
  try {
    if (localStorage.getItem('bgp_consent') === 'granted') {
      gtag('consent', 'update', {
        ad_storage: 'granted', ad_user_data: 'granted',
        ad_personalization: 'granted', analytics_storage: 'granted'
      });
    }
  } catch (e) {}

  if (!/^GTM-[A-Z0-9]{4,}$/.test(BGP_GTM_ID) || BGP_GTM_ID === 'GTM-XXXXXXX') return;
  dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=' + BGP_GTM_ID;
  document.head.appendChild(s);
})();
