/* BGP landingspagina: cookiekeuze, formulier, bedankt-event */
(function(){
  'use strict';
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function ss(k, v){ try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- cookiekeuze ---------- */
  var cc = document.getElementById('cc');
  if (cc) {
    if (!ls('bgp_consent')) cc.hidden = false;
    cc.addEventListener('click', function(e){
      var b = e.target.closest('[data-cc]'); if (!b) return;
      var ok = b.getAttribute('data-cc') === 'granted';
      ls('bgp_consent', ok ? 'granted' : 'denied');
      if (ok && window.gtag) {
        gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
      }
      window.dataLayer && dataLayer.push({ event: 'consent_choice', consent: ok ? 'granted' : 'denied' });
      cc.hidden = true;
    });
  }

  /* ---------- herkomst vastleggen (utm, gclid, fbclid) ---------- */
  var KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','gbraid','wbraid','fbclid'];
  var q = new URLSearchParams(location.search), src = {};
  try { src = JSON.parse(ss('bgp_src') || '{}'); } catch (e) {}
  KEYS.forEach(function(k){ if (q.get(k)) src[k] = q.get(k); });
  if (!src.landing) src.landing = location.href.split('#')[0];
  if (!src.referrer && document.referrer) src.referrer = document.referrer;
  ss('bgp_src', JSON.stringify(src));

  /* ---------- formulier ---------- */
  var form = document.getElementById('aanvraag-form');
  if (form) {
    Object.keys(src).forEach(function(k){
      var f = form.querySelector('input[name="' + k + '"]'); if (f) f.value = src[k];
    });
    var matFld = document.getElementById('fld-materiaal');
    var matHidden = form.querySelector('input[name="materiaal"]');
    function collect(){
      var v = [].map.call(form.querySelectorAll('.chips input:checked'), function(i){ return i.value; });
      matHidden.value = v.join(', ');
      return v.length;
    }
    form.addEventListener('change', function(e){
      if (e.target.closest('.chips') && collect()) matFld.classList.remove('invalid');
    });
    var errEl = document.getElementById('form-err');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (!collect()) {
        matFld.classList.add('invalid');
        matFld.scrollIntoView({ block: 'center' });
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      // honeypot ingevuld: doe alsof het gelukt is, verstuur niets
      if (form.querySelector('input[name="website"]').value) { location.href = '/bedankt.html'; return; }
      var intent = (form.querySelector('input[name="aanvraag_type"]:checked') || {}).value || '';
      btn.disabled = true; btn.textContent = 'Bezig met verzenden';
      if (errEl) errEl.hidden = true;
      fetch(form.getAttribute('data-endpoint'), {
        method: 'POST',
        body: new URLSearchParams(new FormData(form))
      }).then(function(r){
        if (!r.ok) throw new Error('HTTP ' + r.status);
        ss('bgp_lead_pending', JSON.stringify({ intent: intent, materiaal: matHidden.value }));
        location.href = '/bedankt.html';
      }).catch(function(){
        btn.disabled = false; btn.textContent = 'Aanvraag verzenden';
        if (errEl) errEl.hidden = false;
        window.dataLayer && dataLayer.push({ event: 'lead_submit_error' });
      });
    });
    // knop weer actief als de bezoeker terugkomt via de terugknop
    window.addEventListener('pageshow', function(){
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = false; btn.textContent = 'Aanvraag verzenden';
    });
  }

  /* ---------- bedanktpagina: conversie-event, eenmalig ---------- */
  if (document.body.hasAttribute('data-thanks')) {
    var p = ss('bgp_lead_pending');
    if (p) {
      var d = {}; try { d = JSON.parse(p); } catch (e) {}
      window.dataLayer = window.dataLayer || [];
      dataLayer.push({ event: 'lead_submit', lead_intent: d.intent || '', lead_materiaal: d.materiaal || '' });
      ss('bgp_lead_pending', null);
    }
  }
})();
