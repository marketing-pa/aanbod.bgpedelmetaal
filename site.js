/* BGP landingspagina: cookiekeuze, formulier, bedankt-event */
(function(){
  'use strict';
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function ss(k, v){ try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- cookiekeuze ---------- */
  var cc = document.getElementById('cc');
  var C = window.bgpConsent;
  if (cc && C) {
    var box = cc.querySelector('.cc'), prefs = document.getElementById('cc-prefs');
    var prefsBtn = document.getElementById('cc-prefs-btn');
    var fP = document.getElementById('cc-preferences'), fS = document.getElementById('cc-statistics'), fM = document.getElementById('cc-marketing');
    var lastFocus = null;

    function setPrefsOpen(open){
      prefs.hidden = !open;
      prefsBtn.textContent = open ? 'Keuze opslaan' : 'Instellingen';
      prefsBtn.setAttribute('data-cc', open ? 'save' : 'prefs');
    }
    function openCc(showPrefs){
      var c = C.get() || {};
      fP.checked = !!c.preferences; fS.checked = !!c.statistics; fM.checked = !!c.marketing;
      setPrefsOpen(!!showPrefs);
      lastFocus = document.activeElement;
      cc.hidden = false;
      document.body.classList.add('cc-lock');
      box.focus();
    }
    function closeCc(){
      cc.hidden = true;
      document.body.classList.remove('cc-lock');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    // Verplichte keuze: geen sluitknop, Escape en klik ernaast doen niets
    cc.addEventListener('keydown', function(e){
      if (e.key === 'Escape') { e.preventDefault(); return; }
      if (e.key !== 'Tab') return;
      var f = [].filter.call(cc.querySelectorAll('a[href],button,input:not([disabled])'), function(el){ return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    cc.addEventListener('click', function(e){
      var b = e.target.closest('[data-cc]'); if (!b) return;
      var a = b.getAttribute('data-cc');
      if (a === 'prefs') { setPrefsOpen(true); fP.focus(); return; }
      if (a === 'all')  C.save(true, true, true);
      if (a === 'none') C.save(false, false, false);
      if (a === 'save') C.save(fP.checked, fS.checked, fM.checked);
      closeCc();
    });
    document.addEventListener('click', function(e){
      if (e.target.closest('[data-cc-open]')) { e.preventDefault(); openCc(true); }
    });

    if (!C.get()) openCc(false);
  }

  /* ---------- herkomst vastleggen (utm, gclid, fbclid) ---------- */
  var KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','gbraid','wbraid','fbclid'];
  // Alleen met marketingtoestemming bewaard in de sessie; anders enkel uit de huidige URL gelezen
  var q = new URLSearchParams(location.search), src = {};
  var mk = !!(C && C.get() && C.get().marketing);
  if (mk) { try { src = JSON.parse(ss('bgp_src') || '{}'); } catch (e) {} } else { ss('bgp_src', null); }
  KEYS.forEach(function(k){ if (q.get(k)) src[k] = q.get(k); });
  if (!src.landing) src.landing = location.href.split('#')[0];
  if (!src.referrer && document.referrer) src.referrer = document.referrer;
  if (mk) ss('bgp_src', JSON.stringify(src));

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
    // KvK-nummer: alleen cijfers bewaren (spaties, punten of "KvK" bij plakken weg), 8 cijfers verplicht
    var kvk = document.getElementById('f-kvk');
    if (kvk) {
      kvk.addEventListener('input', function(){
        var d = kvk.value.replace(/\D/g, '').slice(0, 8);
        if (kvk.value !== d) kvk.value = d;
        kvk.setCustomValidity('');
      });
      kvk.addEventListener('paste', function(e){
        var t = (e.clipboardData || window.clipboardData).getData('text');
        e.preventDefault();
        kvk.value = t.replace(/\D/g, '').slice(0, 8);
        kvk.dispatchEvent(new Event('input'));
      });
      kvk.addEventListener('invalid', function(){
        kvk.setCustomValidity(kvk.value ? 'Een KvK-nummer bestaat uit 8 cijfers.' : 'Vul uw KvK-nummer in.');
      });
    }
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
