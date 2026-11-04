/* Data is loaded from data/prices.json. No credentials belong in this app. */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const money = value => typeof value === "number" && Number.isFinite(value) ? `¥${value.toLocaleString("zh-CN")}` : "—";
  const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  const airports = { PEK: "北京首都", PKX: "北京大兴", HND: "东京羽田", NRT: "东京成田", KIX: "大阪关西", ITM: "大阪伊丹" };
  const cities = { PEK: "北京", PKX: "北京", HND: "东京", NRT: "东京", KIX: "大阪", ITM: "大阪" };
  const scenery = {
    shinjuku: { city: "东京", place: "新宿街景", file: "tokyo.jpg", credit: "Unsplash", source: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf" },
    tower: { city: "东京", place: "东京塔", file: "tokyo-tower.jpg", credit: "David Kernan · CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:Tokyo_Tower,_Minato_City.jpg" },
    osaka: { city: "大阪", place: "大阪城", file: "osaka-castle.jpg", credit: "663highland · CC BY 2.5", source: "https://commons.wikimedia.org/wiki/File:Osaka_Castle_03bs3200.jpg" },
    skytree: { city: "东京", place: "晴空塔与富士山", file: "tokyo-skytree.jpg", credit: "Atomark · CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Mt.Fuji_%26_Tokyo_SkyTree_(6906783193).jpg" },
    beijing: { city: "北京", place: "天坛", file: "beijing.jpg", credit: "Shujianyang · CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Temple_of_Heaven_20160323_01.jpg" },
    wall: { city: "北京", place: "八达岭长城", file: "beijing-great-wall.jpg", credit: "Reinhold Möller · CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Peking_Grosse_Mauer-20071019-RM-115708.jpg" },
    dotonbori: { city: "大阪", place: "道顿堀", file: "osaka-dotonbori.jpg", credit: "Type specimen · CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Osaka_Dotonbori_Ebisu_Bridge.jpg" },
    sensoji: { city: "东京", place: "浅草寺雷门", file: "tokyo-sensoji.jpg", credit: "Ph0kin · Public domain", source: "https://commons.wikimedia.org/wiki/File:Kaminarimon.jpg" },
    palace: { city: "北京", place: "故宫", file: "beijing-forbidden-city.jpg", credit: "Joshua Doubek · CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:The_Forbidden_City_in_the_summer.JPG" },
    summer: { city: "北京", place: "颐和园", file: "beijing-summer-palace.jpg", credit: "xiquinhosilva · CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Longevity_Hill_of_the_Summer_Palace.jpg" }
  };
  const galleries = { 1: ["shinjuku", "beijing"], 2: ["tower", "osaka", "wall"], 3: ["dotonbori", "sensoji", "palace"], 4: ["skytree", "summer"] };
  const tasks = [
    { id: 1, tab: "北京 ⇄ 东京", sub: "12.20 — 12.30", title: "北京 ⇄ 东京", dates: "2026.12.20 — 12.30", days: "11 天行程", type: "往返直飞", stops: [["北京", "BEIJING"], ["东京", "TOKYO"], ["北京", "BEIJING"]], image: "东京 · TOKYO", period: "2026 冬季" },
    { id: 2, tab: "北京 → 东京 → 大阪 → 北京", sub: "12.20 / 25 / 30", title: "北京 → 东京 → 大阪 → 北京", dates: "2026.12.20 / 12.25 / 12.30", days: "11 天行程", type: "多城市联程", stops: [["北京", "BEIJING"], ["东京", "TOKYO"], ["大阪", "OSAKA"], ["北京", "BEIJING"]], image: "日本 · JAPAN", period: "2026 冬季" },
    { id: 3, tab: "北京 → 大阪 → 东京 → 北京", sub: "12.20 / 25 / 30", title: "北京 → 大阪 → 东京 → 北京", dates: "2026.12.20 / 12.25 / 12.30", days: "11 天行程", type: "多城市联程", stops: [["北京", "BEIJING"], ["大阪", "OSAKA"], ["东京", "TOKYO"], ["北京", "BEIJING"]], image: "日本 · JAPAN", period: "2026 冬季" },
    { id: 4, tab: "北京 ⇄ 东京", sub: "07.05 — 07.18", title: "北京 ⇄ 东京", dates: "2027.07.05 — 07.18", days: "14 天行程", type: "往返直飞", stops: [["北京", "BEIJING"], ["东京", "TOKYO"], ["北京", "BEIJING"]], image: "东京 · TOKYO", period: "2027 夏季" }
  ];
  const state = { data: null, task: 1, period: 30, ranks: new Set([1, 2, 3]), switching: false, pendingTask: null, gallery: {}, recordDates: {} };
  const disclosureJobs = new Map();
  let panelContext = null;
  let archiveContext = null;
  const motion = () => !!window.gsap && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const icons = () => window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });
  const numeric = n => typeof n === "number" && Number.isFinite(n);
  const validTimestamp = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
  function updateStamp(id) {
    const date = history(id).at(-1)?.date;
    const value = state.data.snapshots?.find(row => row.task === id && row.date === date)?.updatedAt;
    if (!validTimestamp(value)) return { time: "—", date: date ? `${date} · 未记录时间` : "未记录时间", value: "" };
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date(value)).map(part => [part.type, part.value]));
    return { time: `${parts.hour}:${parts.minute}:${parts.second}`, date: `${parts.year}-${parts.month}-${parts.day}`, value };
  }
  function history(id) {
    return state.data.history.filter(row => row.task === id).map(row => ({ ...row, lowest: numeric(row.lowest) ? row.lowest : row.r1 })).sort((a, b) => a.date.localeCompare(b.date));
  }
  function rows(id) { return state.data.latest.filter(row => row.task === id).sort((a, b) => a.rank - b.rank); }
  function recordDate(id = state.task) {
    const points = history(id);
    return points.some(p => p.date === state.recordDates[id]) ? state.recordDates[id] : points.at(-1)?.date;
  }
  function recordOptions(id, date) {
    const saved = state.data.snapshots?.find(row => row.task === id && row.date === date);
    if (saved) return [...saved.options].sort((a, b) => a.rank - b.rank);
    const last = history(id).at(-1), latest = rows(id);
    // Legacy files contain details only for the latest recorded day.
    return last?.date === date && latest.every(row => row.price === last[`r${row.rank}`]) ? latest : [];
  }
  function archiveContent(task) {
    const points = history(task.id), date = recordDate(task.id), index = points.findIndex(p => p.date === date);
    const options = recordOptions(task.id, date), point = points[index];
    const latest = index === points.length - 1;
    return `<div class="section-top options-heading"><div><h3 id="options-title">航班方案</h3><span class="result-count">${options.length}</span></div>
      <span class="section-sub">${latest ? "最新记录" : "历史记录"} · 价格从低到高</span></div>
      <div class="archive-toolbar"><label for="record-date">${icon("calendar-days")}记录日期</label>
        <div class="archive-controls">
          <button class="icon-button" data-record-step="-1" aria-label="上一条日期记录" title="上一条日期记录" ${index <= 0 ? "disabled" : ""}>${icon("chevron-left")}</button>
          <select id="record-date" aria-label="航班记录日期" ${points.length ? "" : "disabled"}>${points.length ? [...points].reverse().map(p => `<option value="${p.date}" ${p.date === date ? "selected" : ""}>${p.date}${p.date === points.at(-1).date ? " · 最新" : ""}${recordOptions(task.id, p.date).length ? "" : " · 仅价格"}</option>`).join("") : '<option>暂无记录</option>'}</select>
          <button class="icon-button" data-record-step="1" aria-label="下一条日期记录" title="下一条日期记录" ${index < 0 || latest ? "disabled" : ""}>${icon("chevron-right")}</button>
          ${!latest && points.length ? `<button class="icon-button" data-record-latest aria-label="回到最新记录" title="回到最新记录">${icon("rotate-ccw")}</button>` : ""}
        </div>
      </div>
      <div id="options">${options.length ? options.map((r, i) => option(r, i, task)).join("") : `<div class="archive-empty">${icon("file-clock")}<h4>${point ? "当天未保存航班详情" : "暂无航班记录"}</h4><p>${point ? "已保留当天价格，航司与航段详情未记录。" : "等待首次有效采集。"}</p>${point ? `<div class="archive-prices">${[1, 2, 3].filter(r => numeric(point[`r${r}`])).map(r => `<span>第 ${r} 名<strong>${money(point[`r${r}`])}</strong></span>`).join("")}</div>` : ""}</div>`}</div>`;
  }
  function syncChartSelection() {
    const date = recordDate();
    $$(".chart-hit").forEach(hit => hit.setAttribute("aria-pressed", String(hit.dataset.date === date)));
    $$(".chart-selection").forEach(line => { line.style.display = line.dataset.date === date ? "" : "none"; });
  }
  function selectRecord(date, restoreFocus = false) {
    if (state.switching || !history(state.task).some(p => p.date === date) || date === recordDate()) return;
    state.recordDates[state.task] = date;
    const section = $(".options-section");
    for (const region of [...disclosureJobs.keys()]) if (section.contains(region)) stopDisclosureJob(region);
    archiveContext?.revert(); archiveContext = null;
    if (window.gsap) gsap.killTweensOf($$("*", section));
    section.innerHTML = archiveContent(tasks[state.task - 1]);
    icons();
    syncChartSelection();
    if (restoreFocus) $("#record-date").focus({ preventScroll: true });
    if (motion()) archiveContext = gsap.context(() => {
      gsap.fromTo($$(".option-row,.archive-empty", section), { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .36, stagger: .045, ease: "power2.out", clearProps: "transform,opacity" });
    }, section);
    $("#live-status").textContent = `${date}，${recordOptions(state.task, date).length ? "已显示当天航班方案" : "当天仅保存价格，未保存航班详情"}`;
  }
  function reducedFinal() {
    if (!motion()) {
      panelContext?.revert(); panelContext = null;
      archiveContext?.revert(); archiveContext = null;
      const counter = $(".count-value");
      if (counter) counter.textContent = Number(counter.dataset.value).toLocaleString("zh-CN");
      $$(".option-detail,.journey-detail").forEach(region => {
        stopDisclosureJob(region);
        const open = document.getElementById(region.getAttribute("aria-labelledby"))?.getAttribute("aria-expanded") === "true";
        region.hidden = !open;
        region.classList.toggle("is-expanded", open);
      });
      $$(".scenery-slide").forEach((slide, i) => {
        if (window.gsap) gsap.killTweensOf(slide);
        slide.hidden = i !== (state.gallery[state.task] || 0);
        if (window.gsap) gsap.set(slide, { clearProps: "all" });
      });
    }
  }
  function cleanup() {
    for (const region of disclosureJobs.keys()) stopDisclosureJob(region);
    panelContext?.revert(); panelContext = null;
    archiveContext?.revert(); archiveContext = null;
    if (window.gsap) gsap.killTweensOf($$("*", $("#task-panel")));
  }
  function renderTabs() {
    $("#task-tabs").style.setProperty("--active-index", state.task - 1);
    $("#task-tabs").innerHTML = tasks.map(task => {
      const points = history(task.id);
      const route = `<span class="tab-route-row">${task.tab}</span>`;
      return `<button class="tab" id="tab-${task.id}" role="tab" aria-controls="task-panel" aria-selected="${task.id === state.task}" tabindex="${task.id === state.task ? 0 : -1}" data-task="${task.id}"><span class="tab-num">0${task.id}</span><span class="tab-text"><span class="tab-title">${route}</span><span class="tab-sub">${task.sub}</span></span><span class="tab-price">${money(points.at(-1)?.lowest)}</span></button>`;
    }).join("");
    positionActiveTab(false);
  }
  function positionActiveTab(animate = true) {
    const nav = $(".task-nav"), tab = $(`.tab[data-task="${state.task}"]`);
    if (nav && tab && nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({ left: tab.offsetLeft - (nav.clientWidth - tab.offsetWidth) / 2, behavior: animate && motion() ? "smooth" : "instant" });
    }
  }
  function metric(label, value, note, name) {
    return `<div class="metric"><div class="metric-label">${icon(name)}${label}</div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></div>`;
  }
  function renderPanel(animate = true) {
    const task = tasks.find(t => t.id === state.task);
    const points = history(task.id), options = rows(task.id), last = points.at(-1), previous = points.at(-2);
    const low = last?.lowest, min = points.filter(p => numeric(p.lowest)).map(p => p.lowest);
    const allTime = min.length ? Math.min(...min) : null;
    const difference = numeric(low) && numeric(previous?.lowest) ? low - previous.lowest : null;
    const differenceLabel = difference === null ? "—" : difference === 0 ? "持平" : `${difference > 0 ? "+" : "−"}${money(Math.abs(difference))}`;
    const values = options.map(r => r.price).filter(numeric);
    const spread = values.length > 1 ? Math.max(...values) - Math.min(...values) : null;
    const dateLabel = last?.date ?? "暂无数据";
    const stamp = updateStamp(task.id);
    $("#task-panel").setAttribute("aria-labelledby", `tab-${task.id}`);
    $("#task-panel").innerHTML = `
      <div class="route-header reveal">
        <div><div class="route-kicker">行程 0${task.id}<span>${task.period}</span></div>
        <h2 id="route-title">${task.title}</h2>
        <div class="trip-meta"><span>${icon("calendar-days")}${task.dates}</span><span>${icon("clock-3")}${task.days}</span><span>${icon("route")}${task.type}</span></div>
        <div class="route-stops">${task.stops.map((stop, i) => `${i ? `<span class="route-connector">${icon("plane")}</span>` : ""}<div class="route-stop"><strong>${stop[0]}</strong><small>${stop[1]}</small></div>`).join("")}</div></div>
        ${galleryCard(task.id)}
      </div>
      <div class="metrics reveal">
        ${metric("最新最低价", numeric(low) ? `<span class="currency">¥</span><span class="count-value" data-value="${low}">${low.toLocaleString("zh-CN")}</span>` : "—", esc(dateLabel), "ticket")}
        ${metric("较上次记录", differenceLabel, previous ? `对比 ${esc(previous.date)}` : "基准日 · 暂无对比记录", "arrow-down-up")}
        ${metric("历史最低价", numeric(allTime) ? `<span class="currency">¥</span>${allTime.toLocaleString("zh-CN")}` : "—", `本行程已记录 ${points.length} 天`, "chart-no-axes-combined")}
        ${metric("更新时间", `<time datetime="${esc(stamp.value)}" title="北京时间">${stamp.time}</time>`, esc(stamp.date), "clock-3")}
      </div>
      <div class="workspace reveal">
        <section class="chart-section" aria-labelledby="chart-heading">
          <div class="section-top"><div><h3 id="chart-heading">价格走势</h3><div class="section-sub">前三名每日总价</div></div><div class="period-control" aria-label="价格记录范围">${(task.id === 4 ? [7, 30, 90, 0] : [7, 30, 0]).map(p => `<button data-period="${p}" aria-pressed="${state.period === p}">${p ? `${p} 天` : "全部"}</button>`).join("")}</div></div>
          <div id="chart-area"></div>
        </section>
        <section class="insight" aria-labelledby="insight-heading"><div class="section-top"><div><h3 id="insight-heading">今日价格对比</h3><div class="section-sub">同一行程，选一个更合适的价格</div></div>${icon("list-filter")}</div>
          <div class="insight-rows">${options.map((r, i) => `<div class="insight-row" style="--rank-color:${["var(--accent)", "var(--orange)", "var(--pink)"][i % 3]}"><span class="rank-label">第 ${r.rank} 名</span><div class="bar-track"><div class="bar-fill" style="width:${numeric(r.price) && Math.max(...values) > 0 ? r.price / Math.max(...values) * 100 : 0}%"></div></div><span class="bar-price">${money(r.price)}</span></div>`).join("") || `<p class="section-sub">暂无候选记录</p>`}</div>
          <div class="price-gap"><span>最高与最低相差</span><strong>${money(spread)}</strong></div>
        </section>
      </div>
      <section class="options-section reveal" aria-labelledby="options-title">${archiveContent(task)}</section>`;
    renderChart();
    icons();
    const gallery = $(".destination");
    let touchStart = null;
    gallery.addEventListener("touchstart", event => { touchStart = event.touches[0]?.clientX ?? null; }, { passive: true });
    gallery.addEventListener("touchend", event => {
      if (touchStart === null) return;
      const diff = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
      if (Math.abs(diff) > 40) changeGallery(diff < 0 ? 1 : -1);
      touchStart = null;
    }, { passive: true });
    gallery.addEventListener("keydown", event => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        changeGallery(event.key === "ArrowRight" ? 1 : -1);
      }
    });
    if (animate) animateIn();
  }
  function galleryCard(taskId) {
    const items = galleries[taskId], active = state.gallery[taskId] || 0;
    return `<section class="destination" aria-roledescription="轮播图" aria-label="行程途经城市风景">
      <div class="scenery-stage">${items.map((key, i) => {
        const p = scenery[key];
        return `<figure class="scenery-slide" ${i !== active ? "hidden" : ""} aria-label="${i + 1} / ${items.length}：${p.city} · ${p.place}">
          <img src="./assets/${p.file}?v=20261103-4" alt="${p.city} · ${p.place}" width="960" height="540" loading="eager" draggable="false">
          <figcaption><strong>${p.city}</strong><span>${p.place}</span></figcaption>
          <a class="photo-credit" href="${p.source}" target="_blank" rel="noopener noreferrer" title="照片来源与许可">${esc(p.credit)}</a>
        </figure>`;
      }).join("")}</div>
      <div class="gallery-toolbar"><span class="gallery-count">${String(active + 1).padStart(2, "0")} <span>/ ${String(items.length).padStart(2, "0")}</span></span>
      <div class="gallery-controls"><button class="gallery-arrow" data-gallery-step="-1" aria-label="上一张风景" title="上一张风景">${icon("chevron-left")}</button><div class="gallery-dots">${items.map((key, i) => `<button data-gallery-index="${i}" aria-pressed="${i === active}" aria-label="查看${scenery[key].city}${scenery[key].place}" title="${scenery[key].city} · ${scenery[key].place}"></button>`).join("")}</div><button class="gallery-arrow" data-gallery-step="1" aria-label="下一张风景" title="下一张风景">${icon("chevron-right")}</button></div></div></section>`;
  }
  function changeGallery(step, target) {
    const items = galleries[state.task];
    const previous = state.gallery[state.task] || 0;
    const next = target ?? (previous + step + items.length) % items.length;
    if (next === previous) return;
    state.gallery[state.task] = next;
    const slides = $$(".scenery-slide"), old = slides[previous], incoming = slides[next];
    if (window.gsap) {
      gsap.killTweensOf(slides);
      gsap.set(slides, { clearProps: "all" });
    }
    slides.forEach((slide, i) => { slide.hidden = i !== next; });
    if (motion()) {
      old.hidden = false;
      const direction = step < 0 ? -1 : 1;
      gsap.fromTo(old, { opacity: 1, x: 0, rotationY: 0 }, { opacity: 0, x: -direction * 24, rotationY: -direction * 12, duration: .36, ease: "power2.inOut", onComplete: () => { old.hidden = true; gsap.set(old, { clearProps: "all" }); } });
      gsap.fromTo(incoming, { opacity: 0, x: direction * 24, rotationY: direction * 12 }, { opacity: 1, x: 0, rotationY: 0, duration: .48, ease: "power3.out", clearProps: "all" });
    }
    $(".gallery-count").innerHTML = `${String(next + 1).padStart(2, "0")} <span>/ ${String(items.length).padStart(2, "0")}</span>`;
    $$("[data-gallery-index]").forEach((button, i) => button.setAttribute("aria-pressed", String(i === next)));
    $("#live-status").textContent = `${scenery[items[next]].city} · ${scenery[items[next]].place}`;
  }
  function getJourneys(entry) {
    if (!Array.isArray(entry.legs)) return [];
    const groups = new Map();
    entry.legs.forEach(leg => { const id = leg.journey || 1; if (!groups.has(id)) groups.set(id, []); groups.get(id).push(leg); });
    return [...groups].sort((a, b) => a[0] - b[0]).map(([, flights]) => flights);
  }
  function option(entry, index, task) {
    const journeys = getJourneys(entry), uid = `t${task.id}-r${entry.rank}-${index}`;
    const count = (entry.legs || []).length;
    const transfers = Math.max(0, count - journeys.length);
    const cityRoute = journeys.map((j, i) => `${i === 0 ? `${j[0].from} → ` : ""}${j.at(-1).to}`).join(" → ");
    const bag = String(entry.baggage || "行李额未记录").replace(/\s*included/g, "已含");
    return `<article class="option-row"><button class="option-trigger" id="trigger-${uid}" aria-expanded="false" aria-controls="detail-${uid}">
      <span class="rank rank-${entry.rank}">${entry.rank}</span><span><span class="airline-name">${esc(entry.airline || "航司未记录")}</span><span class="option-caption">${journeys.length} 程 · ${transfers ? `${transfers} 次中转` : "各程直飞"}${entry.rank === 1 ? " · 当日最低" : ""}</span></span>
      <span class="option-overview"><span class="option-route">${esc(cityRoute || "航段未记录")}</span><span class="option-bag">${icon("luggage")}${esc(bag)}</span></span>
      <span class="option-price"><strong>${money(entry.price)}</strong><small>行程总价</small></span>${icon("chevron-down").replace('<i ', '<i class="chevron" ')}</button>
      <div class="option-detail" id="detail-${uid}" role="region" aria-labelledby="trigger-${uid}" hidden inert><div class="collapse-body"><div class="option-inner">${journeys.length ? journeys.map((flights, i) => journey(flights, i, uid, task, journeys.length)).join("") : `<p class="section-sub">该方案暂无逐段数据</p>`}</div></div></div></article>`;
  }
  function journey(flights, i, uid, task, total) {
    const first = flights[0], last = flights.at(-1), id = `${uid}-j${i}`;
    const label = total === 2 && [1, 4].includes(task.id) ? (i === 0 ? "去程" : "返程") : `第 ${i + 1} 程`;
    return `<section class="journey"><button class="journey-trigger" id="trigger-${id}" aria-expanded="false" aria-controls="detail-${id}"><span class="journey-index">${label}</span><span class="journey-route">${esc(cities[first.from] || first.from)} → ${esc(cities[last.to] || last.to)}</span><span class="journey-summary">${esc(first.date)} · ${flights.length > 1 ? `${flights.length - 1} 次中转` : "直飞"}</span>${icon("chevron-down").replace('<i ', '<i class="chevron" ')}</button>
      <div class="journey-detail" id="detail-${id}" role="region" aria-labelledby="trigger-${id}" hidden inert><div class="collapse-body"><div class="journey-inner">${flights.map((f, fi) => `${fi ? `<div class="layover">${icon("repeat-2")}在 ${esc(airports[f.from] || f.from)} 中转${f.date !== flights[fi - 1].date ? " · 跨日航段" : ""}</div>` : ""}
        <div class="flight-segment"><div class="segment-head"><div class="segment-point"><strong>${esc(f.dep)}</strong><small>${esc(f.date)} · ${esc(f.from)}</small><span class="timeline-dot" aria-hidden="true"></span></div><div class="segment-line"><span>${esc(f.duration || "时长未记录")}</span></div><div class="segment-point"><strong>${esc(f.arr)}</strong><small>${esc(f.arrDate || f.date)} · ${esc(f.to)}</small><span class="timeline-dot" aria-hidden="true"></span></div></div>
        <div class="segment-tags"><span>${icon("map-pin")}${esc(airports[f.from] || f.from)} → ${esc(airports[f.to] || f.to)}</span>${f.seat ? `<span>${icon("armchair")}${esc(f.seat)}</span>` : ""}</div></div>`).join("")}</div></div></div></section>`;
  }
  function filteredHistory() {
    const points = history(state.task);
    if (!state.period || !points.length) return points;
    const end = Date.parse(`${points.at(-1).date}T00:00:00Z`);
    return points.filter(p => end - Date.parse(`${p.date}T00:00:00Z`) < state.period * 86400000);
  }
  function renderChart() {
    const points = filteredHistory();
    const colors = ["var(--accent)", "var(--orange)", "var(--pink)"];
    const values = points.flatMap(p => [1, 2, 3].filter(r => state.ranks.has(r)).map(r => p[`r${r}`])).filter(numeric);
    const legend = `<div class="legend" aria-label="图表系列">${[1, 2, 3].map(r => `<button class="legend-item" style="--rank-color:${colors[r - 1]}" data-rank="${r}" aria-pressed="${state.ranks.has(r)}"><span class="legend-dot"></span>第 ${r} 名 <strong>${money(points.at(-1)?.[`r${r}`])}</strong></button>`).join("")}</div>`;
    if (!values.length) {
      $("#chart-area").innerHTML = `<div class="empty-chart">暂无价格记录</div>${legend}`;
      return;
    }
    const W = Math.max(280, $("#chart-area").clientWidth), H = 196, L = 50, R = 65, T = 24, B = 30;
    let min = Math.min(...values), max = Math.max(...values);
    const padding = Math.max((max - min) * .22, 70);
    min = Math.max(0, Math.floor((min - padding) / 50) * 50);
    max = Math.ceil((max + padding) / 50) * 50;
    const firstDate = Date.parse(points[0].date);
    const lastDate = Date.parse(points.at(-1).date);
    const x = i => lastDate === firstDate ? (L + W - R) / 2 : L + (Date.parse(points[i].date) - firstDate) / (lastDate - firstDate) * (W - L - R);
    const y = value => T + (max - value) / (max - min) * (H - T - B);
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="本行程前三名价格走势，共 ${points.length} 天记录"><title>前三名价格走势，共 ${points.length} 天</title>`;
    for (let i = 0; i < 4; i++) {
      const v = min + (max - min) * i / 3, yy = y(v);
      svg += `<line class="grid-line" x1="${L}" x2="${W - 16}" y1="${yy}" y2="${yy}"/><text x="${L - 10}" y="${yy + 4}" text-anchor="end">${money(Math.round(v))}</text>`;
    }
    points.forEach((p, i) => {
      svg += `<line class="chart-selection" data-date="${p.date}" x1="${x(i)}" x2="${x(i)}" y1="${T - 8}" y2="${H - B}" style="${p.date === recordDate() ? "" : "display:none"}"/>`;
    });
    for (let rank = 1; rank <= 3; rank++) {
      if (!state.ranks.has(rank)) continue;
      const entries = points.map((p, i) => ({ p, i })).filter(({ p }) => numeric(p[`r${rank}`]));
      const coords = entries.map(({ p, i }) => {
        const same = [1, 2, 3].filter(r => state.ranks.has(r) && numeric(p[`r${r}`]) && Math.abs(y(p[`r${r}`]) - y(p[`r${rank}`])) < 12);
        return { px: x(i) + (same.length > 1 ? (same.indexOf(rank) - (same.length - 1) / 2) * 13 : 0), py: y(p[`r${rank}`]), p, i };
      });
      if (coords.length > 1) svg += `<path class="trend-path" d="${coords.map((p, i) => `${i ? "L" : "M"}${p.px},${p.py}`).join(" ")}" fill="none" stroke="${colors[rank - 1]}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ${rank === 3 ? 'stroke-dasharray="4 5"' : ""}/>`;
      coords.forEach(({ px, py, p }) => {
        svg += `<circle class="chart-dot" cx="${px}" cy="${py}" r="4" fill="var(--surface)" stroke="${colors[rank - 1]}" stroke-width="2.5"/>`;
      });
      if (coords.length) {
        const c = coords.at(-1);
        svg += `<text class="chart-price" x="${W - 2}" y="${20 + (rank - 1) * 20}" text-anchor="end" style="fill:${colors[rank - 1]}">${money(c.p[`r${rank}`])}</text>`;
      }
    }
    const maxLabels = 5, step = Math.max(1, Math.ceil((points.length - 1) / (maxLabels - 1)));
    points.forEach((p, i) => {
      if (i % step === 0 || i === points.length - 1) svg += `<text x="${x(i)}" y="${H - 5}" text-anchor="middle">${esc(p.date.slice(5).replace("-", "."))}</text>`;
      const left = i ? (x(i - 1) + x(i)) / 2 : L;
      const right = i < points.length - 1 ? (x(i + 1) + x(i)) / 2 : W - R;
      svg += `<rect class="chart-hit" tabindex="0" role="button" aria-pressed="${p.date === recordDate()}" aria-label="${esc(p.date)}，${[1, 2, 3].filter(r => state.ranks.has(r)).map(r => `第${r}名${money(p[`r${r}`])}`).join("，")}，查看当天航班记录" data-date="${p.date}" data-point="${i}" x="${left}" y="${T - 12}" width="${Math.max(right - left, 10)}" height="${H - B - T + 12}" fill="transparent"/>`;
    });
    svg += "</svg>";
    $("#chart-area").innerHTML = `<div class="chart">${svg}<div class="chart-tooltip" hidden></div></div>${legend}<div class="baseline-note">${icon("info")}${points.length === 1 ? "当前仅有 1 天记录，后续更新后形成趋势线" : `显示 ${points[0].date} 至 ${points.at(-1).date} · ${points.length} 天记录`}</div>`;
    icons();
    $$(".chart-hit").forEach(hit => {
      const show = () => {
        const p = points[+hit.dataset.point], tip = $(".chart-tooltip");
        tip.innerHTML = `${esc(p.date)}<br>${[1, 2, 3].filter(r => state.ranks.has(r)).map(r => `第 ${r} 名 ${money(p[`r${r}`])}`).join("<br>")}`;
        tip.hidden = false;
        const box = $(".chart").getBoundingClientRect(), hb = hit.getBoundingClientRect();
        tip.style.left = `${Math.max(75, Math.min(box.width - 75, hb.x - box.x + hb.width / 2))}px`;
        tip.style.top = "75px";
      };
      hit.addEventListener("pointerenter", show);
      hit.addEventListener("focus", show);
      hit.addEventListener("pointerleave", () => { $(".chart-tooltip").hidden = true; });
      hit.addEventListener("blur", () => { $(".chart-tooltip").hidden = true; });
      hit.addEventListener("click", () => selectRecord(hit.dataset.date));
      hit.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectRecord(hit.dataset.date); }
      });
    });
  }
  function animateChart() {
    if (!motion()) return;
    gsap.fromTo($$(".chart-dot"), { opacity: 0 }, { opacity: 1, duration: .45, stagger: .025, overwrite: true });
    $$(".trend-path").forEach(path => {
      const length = path.getTotalLength();
      if (path.getAttribute("stroke-dasharray")) return;
      gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: .9, ease: "power2.out", clearProps: "strokeDasharray,strokeDashoffset" });
    });
  }
  function animateIn() {
    if (!motion()) return;
    panelContext = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".reveal", { y: 15, opacity: 0, duration: .55, stagger: .07 });
      tl.from(".option-row", { y: 10, opacity: 0, duration: .4, stagger: .065 }, .25);
      tl.from(".bar-fill", { scaleX: 0, duration: .85, stagger: .08, ease: "power2.out" }, .2);
      tl.from(".scenery-slide:not([hidden]) img", { scale: 1.05, duration: 1.1 }, 0);
      const counter = $(".count-value");
      if (counter) {
        const number = { value: +counter.dataset.value * .85 };
        tl.to(number, { value: +counter.dataset.value, duration: .8, onUpdate: () => { counter.textContent = Math.round(number.value).toLocaleString("zh-CN"); } }, .12);
      }
      animateChart();
    }, $("#task-panel"));
  }
  function switchTask(id, focus = false) {
    if (state.switching) { state.pendingTask = { id, focus }; return; }
    if (id === state.task) return;
    const previous = state.task;
    state.task = id;
    if (id !== 4 && state.period === 90) state.period = 30;
    $("#task-tabs").style.setProperty("--active-index", id - 1);
    $$(".tab").forEach(tab => {
      const selected = +tab.dataset.task === id;
      tab.setAttribute("aria-selected", selected);
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    positionActiveTab();
    const finish = () => {
      cleanup();
      $("#task-panel").style.removeProperty("opacity");
      $("#task-panel").style.removeProperty("transform");
      renderPanel();
      state.switching = false;
      if (pendingData) {
        const next = pendingData;
        pendingData = null;
        applyData(next);
      }
      const navTop = $(".task-nav").offsetTop;
      if (window.scrollY > navTop) window.scrollTo({ top: navTop, behavior: motion() ? "smooth" : "instant" });
      $("#live-status").textContent = `已切换到行程 ${id}：${tasks[id - 1].title}`;
      const url = new URL(location.href);
      url.hash = `task-${id}`;
      historyReplace(url);
      if (state.pendingTask) {
        const pending = state.pendingTask;
        state.pendingTask = null;
        switchTask(pending.id, pending.focus);
      }
    };
    if (motion()) {
      state.switching = true;
      gsap.to("#task-panel", { x: id > previous ? -8 : 8, opacity: 0, duration: .16, ease: "power1.in", onComplete: finish });
    } else finish();
  }
  function historyReplace(url) { window.history.replaceState(null, "", url); }
  function stopDisclosureJob(region) {
    const job = disclosureJobs.get(region);
    if (!job) return;
    cancelAnimationFrame(job.frame);
    clearTimeout(job.timer);
    region.removeEventListener("transitionend", job.end);
    disclosureJobs.delete(region);
  }
  function setDisclosure(button, open) {
    const region = document.getElementById(button.getAttribute("aria-controls"));
    stopDisclosureJob(region);
    button.setAttribute("aria-expanded", String(open));
    if (button.classList.contains("option-trigger")) button.closest(".option-row").classList.toggle("is-open", open);
    region.inert = !open;
    if (!open && region.contains(document.activeElement)) button.focus({ preventScroll: true });
    if (!motion()) {
      region.hidden = !open;
      region.classList.toggle("is-expanded", open);
      return;
    }
    const job = { frame: 0, timer: 0, end: null };
    disclosureJobs.set(region, job);
    if (open) {
      region.hidden = false;
      // Commit the collapsed grid before starting its reversible CSS transition.
      region.getBoundingClientRect();
      job.frame = requestAnimationFrame(() => { region.classList.add("is-expanded"); stopDisclosureJob(region); });
    } else {
      region.classList.remove("is-expanded");
      const complete = () => {
        if (button.getAttribute("aria-expanded") === "false") region.hidden = true;
        stopDisclosureJob(region);
      };
      job.end = event => { if (event.target === region && event.propertyName === "grid-template-rows") complete(); };
      region.addEventListener("transitionend", job.end);
      job.timer = setTimeout(complete, 480);
    }
  }
  function disclose(button) {
    const open = button.getAttribute("aria-expanded") !== "true";
    if (open) {
      const option = button.classList.contains("option-trigger");
      const group = option ? $("#options") : button.closest(".option-detail");
      $$(option ? ".option-trigger" : ".journey-trigger", group)
        .filter(other => other !== button && other.getAttribute("aria-expanded") === "true")
        .forEach(other => setDisclosure(other, false));
    }
    setDisclosure(button, open);
  }
  function validate(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.history) || !Array.isArray(data.latest)) throw new Error("数据文件结构不正确");
    if (data.updatedAt !== undefined && !validTimestamp(data.updatedAt)) throw new Error("更新时间必须包含日期、时分秒和时区");
    const seen = new Set();
    const validDate = date => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
    for (const row of data.history) {
      const key = `${row.task}:${row.date}`;
      if (!Number.isInteger(row.task) || row.task < 1 || row.task > 4 || !validDate(row.date) || seen.has(key)) throw new Error("历史记录包含无效任务、日期或重复项");
      for (const field of ["lowest", "r1", "r2", "r3"]) if (row[field] != null && (!numeric(row[field]) || row[field] < 0)) throw new Error("价格必须是非负数");
      seen.add(key);
    }
    seen.clear();
    for (const row of data.latest) {
      const key = `${row.task}:${row.rank}`;
      if (!Number.isInteger(row.task) || row.task < 1 || row.task > 4 || ![1, 2, 3].includes(row.rank) || seen.has(key) || !numeric(row.price) || row.price < 0 || !Array.isArray(row.legs)) throw new Error("最新方案格式不正确");
      for (const leg of row.legs) {
        if (!leg.from || !leg.to || !leg.date || !/^\d{1,2}:\d{2}$/.test(leg.dep) || !/^\d{1,2}:\d{2}$/.test(leg.arr)) throw new Error("航段字段不完整");
      }
      seen.add(key);
    }
    if (data.snapshots !== undefined) {
      if (!Array.isArray(data.snapshots)) throw new Error("历史方案 snapshots 必须是数组");
      seen.clear();
      for (const snapshot of data.snapshots) {
        if (!snapshot || !validDate(snapshot.date) || !Number.isInteger(snapshot.task) || snapshot.task < 1 || snapshot.task > 4) throw new Error("历史方案日期或任务无效");
        if (snapshot.updatedAt !== undefined && !validTimestamp(snapshot.updatedAt)) throw new Error("任务更新时间格式不正确");
        const key = `${snapshot.task}:${snapshot.date}`;
        const point = data.history.find(row => row.task === snapshot.task && row.date === snapshot.date);
        if (seen.has(key) || !point || !Array.isArray(snapshot.options) || snapshot.options.length < 1 || snapshot.options.length > 3) throw new Error("历史方案重复、缺少价格记录或方案数量无效");
        const ranks = new Set();
        for (const row of snapshot.options) {
          if (!row || row.task !== snapshot.task || ![1, 2, 3].includes(row.rank) || ranks.has(row.rank) || !numeric(row.price) || row.price < 0 || row.price !== point[`r${row.rank}`] || !Array.isArray(row.legs) || !row.legs.length) throw new Error("历史方案排名、价格或航段与记录不一致");
          for (const leg of row.legs) {
            if (!leg || !leg.from || !leg.to || !leg.date || !/^\d{1,2}:\d{2}$/.test(leg.dep) || !/^\d{1,2}:\d{2}$/.test(leg.arr)) throw new Error("历史方案航段字段不完整");
          }
          ranks.add(row.rank);
        }
        if ([1, 2, 3].some(rank => numeric(point[`r${rank}`]) !== ranks.has(rank))) throw new Error("历史方案未包含当天全部排名");
        seen.add(key);
      }
    }
  }
  let pendingData = null, refreshJob = null, lastCheck = 0;
  const remoteSource = location.hostname === "yu-xiaohei.github.io"
    ? "https://raw.githubusercontent.com/Yu-xiaohei/YUNO-Lyra_Sterling/main/data/prices.json" : null;
  async function readData(source) {
    const url = new URL(source, location.href);
    url.searchParams.set("_", Date.now());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(`数据读取失败 (${response.status})`);
      const data = await response.json();
      validate(data);
      return data;
    } finally { clearTimeout(timeout); }
  }
  function applyData(data) {
    // A delayed CDN response must not roll back a newer, timestamped file.
    if (validTimestamp(state.data?.updatedAt) &&
      (!validTimestamp(data.updatedAt) || Date.parse(data.updatedAt) < Date.parse(state.data.updatedAt))) {
      throw new Error("返回的数据版本早于当前记录");
    }
    if (state.switching) { pendingData = data; return; }
    if (JSON.stringify(data) === JSON.stringify(state.data)) return;
    const initial = !state.data;
    const expanded = $$(".option-trigger[aria-expanded=true],.journey-trigger[aria-expanded=true]").map(button => button.id);
    const focusId = document.activeElement?.id;
    if (!initial) {
      for (const task of tasks) {
        if (state.recordDates[task.id] === history(task.id).at(-1)?.date) delete state.recordDates[task.id];
      }
      cleanup();
    }
    state.data = data;
    if (initial) {
      const requested = Number(location.hash.match(/^#task-([1-4])$/)?.[1]);
      if (requested) state.task = requested;
    }
    renderTabs(); renderPanel(initial);
    for (const id of expanded) {
      const button = document.getElementById(id);
      if (button?.matches(".option-trigger,.journey-trigger")) {
        button.setAttribute("aria-expanded", "true");
        const region = document.getElementById(button.getAttribute("aria-controls"));
        region.hidden = false;
        region.inert = false;
        region.classList.add("is-expanded");
      }
    }
    if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
    if (!initial) $("#live-status").textContent = "航班数据已更新";
  }
  async function refreshData(force = false) {
    if (refreshJob || (!force && (document.hidden || Date.now() - lastCheck < 5000))) return refreshJob;
    lastCheck = Date.now();
    refreshJob = (async () => {
      let fallback = false;
      let data;
      try {
        try { data = await readData(remoteSource || "./data/prices.json"); }
        catch (error) {
          // Published JSON is an initial offline fallback, never a replacement for live data.
          if (!remoteSource || state.data) throw error;
          data = await readData("./data/prices.json");
          fallback = true;
        }
        applyData(data);
        const lastDate = [...data.history.map(row => row.date)].sort().at(-1);
        $("#updated").textContent = `${lastDate ? `记录更新 ${lastDate.replaceAll("-", ".")}` : "暂无价格记录"}${fallback ? " · 已发布版本，等待同步" : ""}`;
      } catch (error) {
        if (state.data) {
          $("#updated").textContent = "更新检查失败 · 已保留上次有效数据";
          return;
        }
        $("#updated").textContent = "数据暂不可用";
        $("#task-panel").innerHTML = `<div class="error-state"><h2>暂时无法读取价格</h2><p>${esc(error.message)}</p><button id="retry">重新加载</button></div>`;
        $("#retry").onclick = () => refreshData(true);
      }
    })();
    try { await refreshJob; }
    finally { refreshJob = null; }
  }
  function init() {
    refreshData(true);
    setInterval(() => refreshData(), 60000);
    window.addEventListener("focus", () => refreshData());
    window.addEventListener("online", () => refreshData(true));
    window.addEventListener("pageshow", event => { if (event.persisted) refreshData(true); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshData(); });
  }
  document.addEventListener("click", event => {
    const recordStep = event.target.closest("[data-record-step]");
    if (recordStep && !recordStep.disabled) {
      const points = history(state.task), index = points.findIndex(p => p.date === recordDate());
      if (points[index + +recordStep.dataset.recordStep]) selectRecord(points[index + +recordStep.dataset.recordStep].date, true);
    }
    if (event.target.closest("[data-record-latest]")) selectRecord(history(state.task).at(-1)?.date, true);
    const galleryStep = event.target.closest("[data-gallery-step]");
    if (galleryStep) changeGallery(+galleryStep.dataset.galleryStep);
    const galleryIndex = event.target.closest("[data-gallery-index]");
    if (galleryIndex) changeGallery(1, +galleryIndex.dataset.galleryIndex);
    const tab = event.target.closest("[data-task]");
    if (tab) switchTask(+tab.dataset.task);
    const disclosure = event.target.closest(".option-trigger,.journey-trigger");
    if (disclosure) disclose(disclosure);
    const period = event.target.closest("[data-period]");
    if (period) {
      state.period = +period.dataset.period;
      $$("[data-period]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.period === state.period)));
      renderChart(); animateChart();
    }
    const rank = event.target.closest("[data-rank]");
    if (rank) {
      const r = +rank.dataset.rank;
      if (state.ranks.has(r) && state.ranks.size === 1) return;
      state.ranks.has(r) ? state.ranks.delete(r) : state.ranks.add(r);
      renderChart(); animateChart();
    }
  });
  document.addEventListener("change", event => {
    if (event.target.id === "record-date") selectRecord(event.target.value, true);
  });
  $("#task-tabs").addEventListener("keydown", event => {
    const current = event.target.closest("[role=tab]");
    if (!current) return;
    const id = +current.dataset.task;
    const next = { ArrowRight: id % 4 + 1, ArrowLeft: (id + 2) % 4 + 1, Home: 1, End: 4 }[event.key];
    if (next) { event.preventDefault(); switchTask(next, true); }
  });
  const themeButton = $("#theme-toggle");
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeButton.innerHTML = icon(theme === "dark" ? "sun" : "moon");
    themeButton.setAttribute("aria-label", theme === "dark" ? "切换浅色模式" : "切换深色模式");
    themeButton.title = themeButton.getAttribute("aria-label");
    icons();
  }
  let savedTheme;
  try { savedTheme = localStorage.getItem("flight-watch-theme"); } catch {}
  setTheme(savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  themeButton.addEventListener("click", () => {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(theme);
    try { localStorage.setItem("flight-watch-theme", theme); } catch {}
  });
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", reducedFinal);
  window.addEventListener("hashchange", () => {
    const id = Number(location.hash.match(/^#task-([1-4])$/)?.[1]);
    if (id && state.data) switchTask(id);
  });
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (state.data && $("#chart-area")) { renderChart(); positionActiveTab(false); }
    }, 160);
  });
  window.addEventListener("pagehide", cleanup);
  init();
})();
