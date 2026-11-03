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

  /* ---------- meetpunten voor GA4 (via GTM) ---------- */
  window.dataLayer = window.dataLayer || [];
  function dl(o){ window.dataLayer.push(o); }
  // scrolldiepte 25/50/75/90, elk één keer per paginabezoek
  (function(){
    var marks = [25, 50, 75, 90], done = {};
    function onScroll(){
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      if (max <= 0) return;
      var pct = (h.scrollTop || document.body.scrollTop) / max * 100;
      marks.forEach(function(m){ if (pct >= m && !done[m]) { done[m] = 1; dl({ event: 'scroll_depth', scroll_percent: m }); } });
      if (done[90]) window.removeEventListener('scroll', onScroll);
    }
    if (!document.body.hasAttribute('data-thanks')) window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* ---------- formulier ---------- */
  var form = document.getElementById('aanvraag-form');
  if (form) {
    Object.keys(src).forEach(function(k){
      var f = form.querySelector('input[name="' + k + '"]'); if (f) f.value = src[k];
    });
    var matHidden = form.querySelector('input[name="materiaal"]');
    var btn = form.querySelector('button[type="submit"]');
    var changeBtn = form.querySelector('.change');
    var radios = [].slice.call(form.querySelectorAll('input[name="aanvraag_type"]'));
    // Formulier in twee stappen op alle schermen: eerst de keuze, daarna de velden
    var mobile = { matches: true };
    var started = false;

    function collect(){
      var v = [].map.call(form.querySelectorAll('.chips input:checked'), function(i){ return i.value; });
      matHidden.value = v.join(', ');
      return v.length;
    }
    function intent(){ var r = form.querySelector('input[name="aanvraag_type"]:checked'); return r ? r.value : ''; }
    function btnLabel(){ var r = form.querySelector('input[name="aanvraag_type"]:checked'); return (r && r.getAttribute('data-btn')) || btn.getAttribute('data-default'); }
    function start(){ if (started) return; started = true; dl({ event: 'form_start', lead_intent: intent() }); }

    var progEl = form.querySelector('.form-progress'), stepEl = form.querySelector('.form-step');
    function setStep(n){
      if (!progEl) return;
      progEl.hidden = false; stepEl.textContent = 'Stap ' + n + ' van 2';
      [].forEach.call(progEl.querySelectorAll('.form-steps i'), function(el, i){ el.classList.toggle('on', i < n); });
    }
    if (mobile.matches && !intent()) { form.classList.add('is-staged'); setStep(1); }

    radios.forEach(function(r){
      r.addEventListener('change', function(){
        radios.forEach(function(x){ x.closest('.radio').classList.toggle('is-picked', x.checked); });
        btn.textContent = btnLabel();
        start();
        dl({ event: 'form_intent', lead_intent: intent() });
        if (mobile.matches) {
          var first = form.classList.contains('is-staged');
          form.classList.remove('is-staged');
          form.classList.add('is-chosen');
          if (changeBtn) changeBtn.hidden = false;
          setStep(2);
          // focus naar het eerste veld (alleen bij de eerste keuze)
          if (first) { var f1 = document.getElementById('f-bedrijf'); if (f1) f1.focus({ preventScroll: true }); }
        }
      });
    });
    // knoppen met data-intent kiezen meteen de juiste optie in het formulier
    document.addEventListener('click', function(e){
      var l = e.target.closest('[data-intent]'); if (!l) return;
      var r = form.querySelector('input[name="aanvraag_type"][value="' + l.getAttribute('data-intent') + '"]');
      if (r && !r.checked) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    if (changeBtn) changeBtn.addEventListener('click', function(){
      form.classList.remove('is-chosen');
      changeBtn.hidden = true;
      var r = form.querySelector('input[name="aanvraag_type"]:checked'); if (r) r.focus();
    });
    form.addEventListener('focusin', function(e){ if (e.target.matches('input[type=text],input[type=tel],input[type=email]')) start(); });
    form.addEventListener('change', function(e){ if (e.target.closest('.chips')) collect(); });

    // formulier in beeld: één event, en de sticky balk schuift weg zolang het formulier zichtbaar is
    var sticky = document.querySelector('.sticky');
    if ('IntersectionObserver' in window) {
      var seen = false;
      new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if (en.isIntersecting && en.intersectionRatio >= 0.3 && !seen) { seen = true; dl({ event: 'form_view' }); }
          if (sticky) sticky.classList.toggle('is-hidden', en.isIntersecting);
        });
      }, { threshold: [0, 0.3] }).observe(form);
    }

    // KvK-nummer (optioneel): alleen cijfers bewaren, als het ingevuld is 8 cijfers
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
      kvk.addEventListener('invalid', function(){ kvk.setCustomValidity('Een KvK-nummer bestaat uit 8 cijfers. U mag het ook leeg laten.'); });
    }

    var errEl = document.getElementById('form-err');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      collect();
      // honeypot ingevuld: doe alsof het gelukt is, verstuur niets
      if (form.querySelector('input[name="website"]').value) { location.href = '/bedankt.html'; return; }
      var it = intent();
      btn.disabled = true; btn.textContent = 'Bezig met verzenden';
      if (errEl) errEl.hidden = true;
      fetch(form.getAttribute('data-endpoint'), {
        method: 'POST',
        body: new URLSearchParams(new FormData(form))
      }).then(function(r){
        if (!r.ok) throw new Error('HTTP ' + r.status);
        ss('bgp_lead_pending', JSON.stringify({ intent: it, materiaal: matHidden.value }));
        location.href = '/bedankt.html';
      }).catch(function(){
        btn.disabled = false; btn.textContent = btnLabel();
        if (errEl) errEl.hidden = false;
        dl({ event: 'lead_submit_error' });
      });
    });
    // knop weer actief als de bezoeker terugkomt via de terugknop
    window.addEventListener('pageshow', function(){ btn.disabled = false; btn.textContent = btnLabel(); });
  }

  /* ---------- video klantenplatform ---------- */
  // Speelt zonder geluid af zolang hij in beeld is; pauzeren kan altijd (WCAG 2.2.2).
  // Niet automatisch bij "beweging beperken" of databesparing: dan staat er een afspeelknop.
  var vid = document.getElementById('platform-video');
  if (vid) {
    var vwrap = vid.closest('.vid'), vbtn = vwrap.querySelector('.vid-toggle'), vlbl = vbtn.querySelector('.vid-lbl');
    var VN = 'platform_rondleiding';
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    var noAuto = window.matchMedia('(prefers-reduced-motion: reduce)').matches || saveData;
    var userPaused = noAuto, vSeen = false, vDone = false, vLast = 0;
    function vSync(){
      var on = !vid.paused;
      vwrap.classList.toggle('is-playing', on);
      vbtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      vlbl.textContent = on ? 'Video pauzeren' : 'Video afspelen';
    }
    function vPlay(){
      if (vid.preload === 'none') vid.preload = 'auto';
      var pr = vid.play(); if (pr && pr.catch) pr.catch(vSync);
    }
    function vToggle(){
      if (vid.paused) { userPaused = false; vPlay(); dl({ event: 'video_play', video_name: VN }); }
      else { userPaused = true; vid.pause(); dl({ event: 'video_pause', video_name: VN }); }
    }
    vid.addEventListener('play', vSync); vid.addEventListener('pause', vSync);
    vbtn.addEventListener('click', vToggle);
    vid.addEventListener('click', vToggle);
    // eerste volledige doorloop (de video loopt in een lus, dus geen 'ended')
    vid.addEventListener('timeupdate', function(){
      if (!vDone && vid.currentTime + 1 < vLast) { vDone = true; dl({ event: 'video_complete', video_name: VN }); }
      vLast = vid.currentTime;
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(en){
        en.forEach(function(x){
          if (x.isIntersecting) {
            if (!vSeen) { vSeen = true; dl({ event: 'video_view', video_name: VN }); }
            if (!userPaused) vPlay();
          } else if (!vid.paused) { vid.pause(); }
        });
      }, { threshold: 0.5 }).observe(vid);
    }
    vSync();
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
