/* Tutto il JavaScript del sito: sostituisce jQuery + i 340 KB di script di Semplice. */
(function () {
  var body = document.body;

  // 1. breakpoint: il CSS di Semplice legge body[data-breakpoint]
  var bp = [
    ["xs", "(max-width: 543.9px)"],
    ["sm", "(min-width: 544px) and (max-width: 767.9px)"],
    ["md", "(min-width: 768px) and (max-width: 991.9px)"],
    ["lg", "(min-width: 992px) and (max-width: 1169.9px)"],
    ["xl", "(min-width: 1170px)"]
  ];
  function breakpoint() {
    for (var i = 0; i < bp.length; i++) {
      if (matchMedia(bp[i][1]).matches) body.setAttribute("data-breakpoint", bp[i][0]);
    }
  }

  // 2. griglia a mattoni (home e pagina Animated GIF): ogni riquadro va nella colonna più corta
  function mattoni() {
    document.querySelectorAll(".masonry").forEach(function (m) {
      var items = [].slice.call(m.querySelectorAll(".masonry-item"));
      if (!items.length) return;
      m.style.position = "relative";
      items.forEach(function (it) { it.style.position = "absolute"; });
      var larg = items[0].offsetWidth;
      var colonne = Math.max(1, Math.round(m.clientWidth / larg));
      var alt = [];
      for (var c = 0; c < colonne; c++) alt.push(0);
      items.forEach(function (it) {
        var c = alt.indexOf(Math.min.apply(null, alt));
        it.style.left = c * larg + "px";
        it.style.top = alt[c] + "px";
        alt[c] += it.offsetHeight;
      });
      m.style.height = Math.max.apply(null, alt) + "px";
    });
  }

  function impagina() { breakpoint(); mattoni(); }
  impagina();
  var attesa;
  addEventListener("resize", function () { clearTimeout(attesa); attesa = setTimeout(impagina, 100); });
  addEventListener("load", mattoni);
  if (document.fonts) document.fonts.ready.then(mattoni);

  // 3. animazioni (ex GIF): si caricano e partono solo quando entrano nello schermo
  var video = document.querySelectorAll("video.sv-anim");
  function carica(v) {
    if (v.dataset.src && !v.src) {
      v.poster = v.dataset.poster;
      v.muted = true;
      v.src = v.dataset.src;
    }
  }
  if ("IntersectionObserver" in window) {
    var vicino = new IntersectionObserver(function (voci) {
      voci.forEach(function (e) { if (e.isIntersecting) { carica(e.target); vicino.unobserve(e.target); } });
    }, { rootMargin: "600px 0px" });
    var inVista = new Set();
    var parti = function (v) { var p = v.play(); if (p) p.catch(function () {}); };
    var visibile = new IntersectionObserver(function (voci) {
      voci.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { inVista.add(v); carica(v); parti(v); }
        else { inVista.delete(v); v.pause(); }
      });
    });
    // se la scheda era in secondo piano il browser blocca la partenza: riprova quando torna visibile
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) inVista.forEach(parti);
    });
    video.forEach(function (v) { vicino.observe(v); visibile.observe(v); });
  } else {
    video.forEach(function (v) { carica(v); v.autoplay = true; v.play(); });
  }

  // 4. freccia "torna su"
  var su = document.querySelector(".back-to-top");
  if (su) {
    addEventListener("scroll", function () {
      su.classList.toggle("visibile", scrollY > innerHeight * 1.2);
    }, { passive: true });
    su.addEventListener("click", function (e) {
      e.preventDefault();
      scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // 5. lightbox della galleria: clic sull'animazione -> grande, Esc o clic per chiudere, frecce per scorrere
  var voci = [].slice.call(document.querySelectorAll("a.semplice-lightbox"));
  var aperto = null, indice = 0;
  function mostra(i) {
    indice = (i + voci.length) % voci.length;
    var orig = voci[indice].querySelector("video");
    if (!orig) return;
    var v = aperto.querySelector("video");
    v.poster = orig.dataset.poster;
    v.src = orig.dataset.src;
    v.play().catch(function () {});
  }
  function chiudi() {
    if (!aperto) return;
    aperto.remove();
    aperto = null;
    body.style.overflow = "";
  }
  voci.forEach(function (a, i) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      aperto = document.createElement("div");
      aperto.className = "sv-lightbox";
      aperto.setAttribute("role", "dialog");
      aperto.setAttribute("aria-modal", "true");
      aperto.innerHTML = '<video muted loop playsinline autoplay></video><button aria-label="Close">×</button>';
      aperto.querySelector("video").muted = true;
      aperto.addEventListener("click", chiudi);
      body.appendChild(aperto);
      body.style.overflow = "hidden";
      mostra(i);
      aperto.querySelector("button").focus();
    });
  });
  addEventListener("keydown", function (e) {
    if (!aperto) return;
    if (e.key === "Escape") chiudi();
    if (e.key === "ArrowRight") mostra(indice + 1);
    if (e.key === "ArrowLeft") mostra(indice - 1);
  });
})();
