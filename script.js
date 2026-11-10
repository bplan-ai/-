/* ==========================================================
   주식회사 진웅 홈페이지 — script.js
   - 사진·영상 자리 자동 채우기 / 빈 자리 틀
   - 상단 메뉴, 모바일 메뉴, 스크롤 등장, 숫자 올라가기
   - 사진 띠 패럴랙스, 큰 글자 띠, 제품 사진 확대 보기
   ========================================================== */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==========================================================
     SNS·채널 주소 — 여기 한 곳만 고치면 모든 페이지에 반영됩니다.
     주소를 따옴표 안에 넣으세요. 비워 두면 아이콘이 흐리게 보이고 눌리지 않습니다.
     ========================================================== */
  var CHANNELS = {
    instagram: "",   // 예: "https://www.instagram.com/아이디"
    blog: "",        // 예: "https://blog.naver.com/아이디"
    kakao: "",       // 예: "https://pf.kakao.com/채널ID"
    place: "",       // 네이버 지도·플레이스 주소 (있는 경우만)
    youtube: "https://www.youtube.com/@jinwoong9606" // 기존 홈페이지에 연결되어 있던 회사 채널
  };
  var CONTACT_EMAIL = "jinwoong6767@daum.net";

  var ICONS = {
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17 7h.01"/>',
    blog: '<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4M8 12h8M8 16h5"/>',
    kakao: '<path d="M12 4c-4.7 0-8.5 3-8.5 6.6 0 2.3 1.5 4.3 3.8 5.5L6.5 20l4.1-2.8c.5.1.9.1 1.4.1 4.7 0 8.5-3 8.5-6.7S16.7 4 12 4z"/>',
    place: '<path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    youtube: '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="m10 9.5 5 2.5-5 2.5z"/>',
    mail: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="m4 7 8 6 8-6"/>'
  };
  var LABELS = { instagram: "인스타그램", blog: "네이버 블로그", kakao: "카카오톡 채널", place: "네이버 지도", youtube: "유튜브" };
  var svgIcon = function (name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>";
  };

  // 푸터의 채널 버튼 (data-channels 자리에 그림)
  document.querySelectorAll("[data-channels]").forEach(function (box) {
    var html = "";
    Object.keys(LABELS).forEach(function (key) {
      var url = (CHANNELS[key] || "").trim();
      if (url) {
        html += '<a class="ch-btn" href="' + url + '" target="_blank" rel="noopener" aria-label="' + LABELS[key] + ' (새 창)">' + svgIcon(key) + "<span>" + LABELS[key] + "</span></a>";
      } else {
        html += '<span class="ch-btn is-empty" aria-disabled="true" title="' + LABELS[key] + ' 주소 준비 중">' + svgIcon(key) + "<span>" + LABELS[key] + "</span></span>";
      }
    });
    box.innerHTML = html;
  });

  // 오른쪽 아래 고정 "문의하기" 버튼: 카카오톡 채널이 있으면 그쪽, 없으면 대표 이메일
  if (!document.querySelector(".fab-contact")) {
    var fab = document.createElement("a");
    fab.className = "btn btn-primary fab-contact";
    var kakao = (CHANNELS.kakao || "").trim();
    if (kakao) {
      fab.href = kakao;
      fab.target = "_blank";
      fab.rel = "noopener";
      fab.setAttribute("aria-label", "카카오톡 채널로 문의하기 (새 창)");
      fab.innerHTML = svgIcon("kakao") + "문의하기";
    } else {
      fab.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("[홈페이지 문의] ");
      fab.setAttribute("aria-label", "이메일로 문의하기 (" + CONTACT_EMAIL + ")");
      fab.innerHTML = svgIcon("mail") + "문의하기";
    }
    document.body.appendChild(fab);
  }

  /* ---------- 버튼: Uiverse "cta" 구조로 감싸기 (글자 + 화살표 3개) ---------- */
  var chevron = function (x, cls) {
    return '<path class="' + cls + '" d="M' + x + ' 4 L' + (x + 4) + ' 0 L' + (x + 26) + ' 21.5 L' + (x + 4) + ' 43 L' + x + ' 39 L' + (x + 17) + ' 21.5 Z"/>';
  };
  var arrowSvg = '<svg viewBox="0 0 66 43" aria-hidden="true" focusable="false">' + chevron(40, 'one') + chevron(20, 'two') + chevron(0, 'three') + '</svg>';
  document.querySelectorAll(".btn").forEach(function (btn) {
    if (btn.querySelector(".cta-label")) return;
    var label = document.createElement("span");
    label.className = "cta-label";
    while (btn.firstChild) label.appendChild(btn.firstChild);
    // 버튼 글자 끝에 있던 "→" 표시는 화살표 3개로 대신함
    Array.prototype.forEach.call(label.querySelectorAll('span[aria-hidden="true"]'), function (s) {
      if (s.textContent.trim() === "→") s.remove();
    });
    btn.appendChild(label);
    if (!btn.closest(".mobile-bar") && !btn.classList.contains("header-cta") && !btn.classList.contains("fab-contact")) {
      var arrow = document.createElement("span");
      arrow.className = "cta-arrow";
      arrow.innerHTML = arrowSvg;
      btn.appendChild(arrow);
    }
    btn.classList.add("is-cta");
  });

  /* ---------- 사진 자리: 파일이 없으면 빈 자리 틀 ---------- */
  // HTML 의 onerror="phFail(this)" 가 호출합니다.
  window.phFail = function (el) {
    var box = el.closest(".ph");
    if (box) box.classList.add("is-empty");
  };
  // 이미 실패한 이미지(스크립트보다 먼저 실패한 경우)도 처리
  document.querySelectorAll(".ph > img").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) window.phFail(img);
  });

  /* ---------- 영상 자리 (intro.mp4 등) ---------- */
  document.querySelectorAll(".ph > video").forEach(function (v) {
    var box = v.closest(".ph");
    var ok = false;
    v.addEventListener("loadeddata", function () { ok = true; box.classList.remove("is-empty"); if (!reduce) v.play().catch(function () {}); });
    v.addEventListener("error", function () { box.classList.add("is-empty"); }, true);
    var src = v.querySelector("source");
    if (src) src.addEventListener("error", function () { box.classList.add("is-empty"); });
    setTimeout(function () { if (!ok && v.readyState < 2) box.classList.add("is-empty"); }, 4000);
  });

  /* ---------- 첫 화면: hero.jpg / hero.mp4 가 있으면 hero--media ---------- */
  var hero = document.querySelector(".hero");
  if (hero) {
    var hImg = hero.querySelector(".hero-media img");
    var hVid = hero.querySelector(".hero-media video");
    if (hImg) {
      var mark = function () { if (hImg.naturalWidth > 0) hero.classList.add("hero--media"); };
      if (hImg.complete) mark(); else hImg.addEventListener("load", mark);
    }
    if (hVid) {
      hVid.addEventListener("loadeddata", function () {
        hero.classList.add("hero--media", "hero--video");
        if (!reduce) hVid.play().catch(function () {});
      });
    }
  }

  /* ---------- 처음 열릴 때 등장 ---------- */
  requestAnimationFrame(function () { requestAnimationFrame(function () { doc.classList.add("is-loaded"); }); });

  /* ---------- 상단 메뉴: 스크롤하면 유리 배경 ---------- */
  var header = document.querySelector(".site-header");
  var onScrollHeader = function () { if (header) header.classList.toggle("is-scrolled", window.scrollY > 12); };
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- 모바일 메뉴 ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = doc.classList.toggle("menu-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    });
    document.querySelectorAll(".mobile-nav a").forEach(function (a) {
      a.addEventListener("click", function () { doc.classList.remove("menu-open"); menuBtn.setAttribute("aria-expanded", "false"); });
    });
  }

  /* ---------- 스크롤 등장 (카드는 0.08초 간격) ---------- */
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.classList.add("reveal");
      child.style.setProperty("--i", i);
    });
  });
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- 숫자 올라가기 (입력된 실제 숫자만) ---------- */
  var counters = document.querySelectorAll("[data-count]");
  var runCount = function (el) {
    var end = parseInt(el.getAttribute("data-count"), 10);
    var start = parseInt(el.getAttribute("data-from") || "0", 10);
    if (reduce) { el.textContent = end; return; }
    var t0 = null, dur = 1400;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (end - start) * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  }

  /* ---------- 사진 띠 패럴랙스 + 큰 글자 띠 (스크롤에 맞춰) ---------- */
  var bands = document.querySelectorAll(".band .ph");
  var rows = document.querySelectorAll(".marquee-row");
  if (!reduce && (bands.length || rows.length)) {
    var ticking = false;
    var update = function () {
      var vh = window.innerHeight;
      bands.forEach(function (ph) {
        var r = ph.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh; // -1 ~ 1
        ph.style.transform = "translate3d(0," + (p * -6).toFixed(2) + "%,0)";
      });
      rows.forEach(function (row, i) {
        var r = row.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top - vh) / (vh + r.height); // -1 ~ 0
        var dir = i % 2 === 0 ? 1 : -1;
        row.style.transform = "translate3d(" + (dir * (p * 18 + (dir > 0 ? 4 : 14))).toFixed(2) + "%,0,0)";
      });
      ticking = false;
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- 제품 사진 묶음: 있는 사진만 보여주기 ---------- */
  // data-photo-group: 사진이 1장이라도 있으면 없는 칸은 숨기고,
  // 한 장도 없으면 data-min 개의 빈 자리 틀만 보여줍니다.
  document.querySelectorAll("[data-photo-group]").forEach(function (group) {
    var items = Array.prototype.slice.call(group.querySelectorAll(".ph"));
    var min = parseInt(group.getAttribute("data-min") || "4", 10);
    var results = new Array(items.length);
    var left = items.length;
    var done = function () {
      var any = results.some(function (r) { return r; });
      items.forEach(function (ph, i) {
        if (any) ph.classList.toggle("is-hidden", !results[i]);
        else ph.classList.toggle("is-hidden", i >= min);
      });
      var box = group.closest("[data-photo-wrap]");
      if (box) box.classList.toggle("has-photos", any);
    };
    items.forEach(function (ph, i) {
      var img = ph.querySelector("img");
      if (!img) { results[i] = false; if (--left === 0) done(); return; }
      var probe = new Image();
      probe.onload = function () { results[i] = true; if (--left === 0) done(); };
      probe.onerror = function () { results[i] = false; ph.classList.add("is-empty"); if (--left === 0) done(); };
      probe.src = img.getAttribute("src");
    });
  });

  /* ---------- 가로 슬라이드 버튼 ---------- */
  document.querySelectorAll("[data-slider-prev], [data-slider-next]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.getElementById(btn.getAttribute("data-target"));
      if (!target) return;
      var dir = btn.hasAttribute("data-slider-next") ? 1 : -1;
      target.scrollBy({ left: dir * target.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* ---------- 확대 보기 (사진이 있는 칸만) ---------- */
  var lb = document.querySelector(".lightbox");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var lbCount = lb.querySelector(".lb-count");
    var list = [], idx = 0, lastFocus = null;
    var show = function (n) {
      idx = (n + list.length) % list.length;
      lbImg.src = list[idx].getAttribute("src");
      lbImg.alt = list[idx].getAttribute("alt") || "";
      var name = (list[idx].getAttribute("alt") || "").split(":")[0];
      lbCount.textContent = (idx + 1) + " / " + list.length + (name ? " · " + name : "");
    };
    var open = function (img) {
      list = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox] .ph:not(.is-empty):not(.is-hidden) > img"));
      idx = list.indexOf(img);
      if (idx < 0) return;
      lastFocus = document.activeElement;
      show(idx);
      lb.classList.add("is-open");
      lb.querySelector(".lb-close").focus();
      document.body.style.overflow = "hidden";
    };
    var close = function () {
      lb.classList.remove("is-open");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };
    document.querySelectorAll("[data-lightbox]").forEach(function (area) {
      area.addEventListener("click", function (e) {
        var ph = e.target.closest(".ph");
        if (!ph || ph.classList.contains("is-empty")) return;
        var img = ph.querySelector("img");
        if (img) open(img);
      });
      area.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        var ph = e.target.closest(".ph");
        if (ph && !ph.classList.contains("is-empty")) open(ph.querySelector("img"));
      });
    });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
    var swiped = false;
    lb.addEventListener("click", function (e) { if (swiped) { swiped = false; return; } if (e.target === lb) close(); });
    // 손가락(또는 마우스)으로 좌우로 밀어서 넘기기
    var startX = null, startY = null;
    lb.addEventListener("pointerdown", function (e) { if (e.target.closest(".icon-btn")) return; startX = e.clientX; startY = e.clientY; });
    lb.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      startX = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { swiped = true; show(idx + (dx < 0 ? 1 : -1)); }
    });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* ---------- 주소 복사 ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var label = btn.querySelector("span");
      var doneMsg = function () { if (label) { var old = label.textContent; label.textContent = "복사했습니다"; setTimeout(function () { label.textContent = old; }, 1800); } };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(doneMsg).catch(function () {});
    });
  });

  /* ---------- 제품 검색·분류 (products.html) ---------- */
  var table = document.querySelector("[data-filter-table]");
  if (table) {
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr[data-cat]"));
    var input = document.querySelector("[data-search]");
    var countEl = document.querySelector("[data-count-result]");
    var emptyEl = document.querySelector("[data-empty]");
    var catBtns = Array.prototype.slice.call(document.querySelectorAll("[data-cat-btn]"));
    var current = "all";
    var norm = function (s) { return (s || "").toLowerCase().replace(/[\s\-·]/g, ""); };
    var apply = function () {
      var q = norm(input ? input.value : "");
      var shown = 0;
      rows.forEach(function (r) {
        var okCat = current === "all" || r.getAttribute("data-cat") === current;
        var okText = !q || norm(r.textContent).indexOf(q) > -1;
        var show = okCat && okText;
        r.classList.toggle("is-hidden", !show);
        if (show) shown++;
      });
      if (countEl) countEl.textContent = shown;
      if (emptyEl) emptyEl.classList.toggle("is-hidden", shown > 0);
    };
    catBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        current = b.getAttribute("data-cat-btn");
        catBtns.forEach(function (x) { x.classList.toggle("is-active", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        apply();
      });
    });
    document.querySelectorAll("[data-tag]").forEach(function (t) {
      t.addEventListener("click", function () { if (input) { input.value = t.getAttribute("data-tag"); apply(); input.focus(); } });
    });
    if (input) {
      input.addEventListener("input", apply);
      var form = input.closest("form");
      if (form) form.addEventListener("submit", function (e) { e.preventDefault(); apply(); });
      try { var q0 = new URLSearchParams(location.search).get("q"); if (q0) input.value = q0; } catch (err) {}
    }
    apply();
  }

  /* ---------- 올해 연도 ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
