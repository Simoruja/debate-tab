// Renders the site from config.js. You shouldn't need to edit this file to
// change prices, services or seasons — edit config.js instead.
(function () {
  "use strict";

  const cfg = window.YARD_CREW_CONFIG;
  const biz = cfg.business;
  const $ = (sel) => document.querySelector(sel);
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

  const seasonById = Object.fromEntries(cfg.seasons.map((s) => [s.id, s]));
  const servicesFor = (seasonId) => cfg.services.filter((s) => s.seasons.includes(seasonId));
  // A service is bookable if any of its seasons is active.
  const isBookable = (svc) => svc.seasons.some((id) => seasonById[id] && seasonById[id].active);

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === false || v == null) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const child of children.flat()) {
      if (child == null) continue;
      node.append(child instanceof Node ? child : document.createTextNode(child));
    }
    return node;
  }

  function startingPrice(svc) {
    const p = svc.pricing;
    if (p.type === "tiered") return Math.min(...p.tiers.map((t) => t.price));
    if (p.type === "hourly") return p.rate;
    if (p.type === "perUnit") return p.rate;
    return 0;
  }

  function priceSummary(svc) {
    const p = svc.pricing;
    if (p.type === "tiered") {
      const prices = p.tiers.map((t) => t.price);
      return `${money(Math.min(...prices))}–${money(Math.max(...prices))} ${p.unit}`;
    }
    if (p.type === "hourly") return `${money(p.rate)} ${p.unit}`;
    if (p.type === "perUnit") return `${money(p.rate)} per ${p.unit}`;
    return "";
  }

  // ---------------------------------------------------------------- basics
  function bindText() {
    document.title = biz.name;
    document.querySelectorAll("[data-bind]").forEach((node) => {
      const value = biz[node.dataset.bind];
      if (value != null) node.textContent = value;
    });
    document.querySelectorAll("[data-bind-href]").forEach((node) => {
      const kind = node.dataset.bindHref;
      if (kind === "tel") node.href = "tel:" + biz.phone.replace(/[^\d+]/g, "");
      if (kind === "mailto") node.href = "mailto:" + biz.email;
    });
    $("#year").textContent = new Date().getFullYear();
    if (biz.instagram) {
      $("#footer-social").append(
        el("a", { href: `https://instagram.com/${biz.instagram}`, rel: "noopener" }, "@" + biz.instagram)
      );
    }
  }

  function currentSeason() {
    const month = new Date().getMonth() + 1;
    return cfg.seasons.find((s) => s.months.includes(month)) || cfg.seasons[0];
  }

  // -------------------------------------------------------------- services
  let activeSeasonId;

  function renderTabs() {
    const tabs = $("#season-tabs");
    tabs.replaceChildren(
      ...cfg.seasons.map((s) =>
        el(
          "button",
          {
            type: "button",
            role: "tab",
            class: "season-tab",
            id: `tab-${s.id}`,
            "aria-selected": String(s.id === activeSeasonId),
            "data-season": s.id,
          },
          el("span", { "aria-hidden": "true" }, s.icon + " "),
          s.label,
          s.active ? null : el("span", { class: "badge badge-soon" }, "Soon")
        )
      )
    );
    tabs.onclick = (e) => {
      const btn = e.target.closest("[data-season]");
      if (btn) selectSeason(btn.dataset.season);
    };
  }

  function serviceCard(svc, season) {
    const p = svc.pricing;
    const priceRows =
      p.type === "tiered"
        ? el(
            "ul",
            { class: "tier-list" },
            p.tiers.map((t) => el("li", {}, el("span", {}, t.label), el("strong", {}, money(t.price))))
          )
        : el(
            "p",
            { class: "price-line" },
            el("strong", {}, money(p.rate)),
            p.type === "hourly" ? ` ${p.unit}` : ` per ${p.unit}`,
            p.type === "hourly" ? el("small", {}, `${p.minCrewHours} crew-hour minimum`) : null,
            p.type === "perUnit" ? el("small", {}, `${p.minUnits} ${p.unit} minimum. ${p.note || ""}`) : null
          );

    const extras = (svc.extras || []).map((x) =>
      el("li", {}, `${x.label}: `, el("strong", {}, x.percent ? `+${x.percent}%` : `+${money(x.price)}`))
    );

    return el(
      "article",
      { class: "card service-card" + (svc.featured ? " featured" : "") + (season.active ? "" : " is-soon") },
      el(
        "div",
        { class: "service-card-head" },
        el("h3", {}, svc.name),
        svc.featured ? el("span", { class: "badge" }, "Most popular") : null,
        season.active ? null : el("span", { class: "badge badge-soon" }, "Coming soon")
      ),
      el("p", { class: "muted" }, svc.description),
      p.type === "tiered" ? el("p", { class: "unit" }, p.unit) : null,
      priceRows,
      extras.length ? el("ul", { class: "extras-list" }, extras) : null,
      p.overNote ? el("p", { class: "fine" }, p.overNote) : null,
      svc.recurring
        ? el("p", { class: "fine" }, `Save ${cfg.recurringDiscountPercent}% with recurring service (${svc.recurring}).`)
        : null,
      svc.proRange
        ? el("p", { class: "pro-range" }, `Typical pro price: ${svc.proRange} ${svc.proNote || ""}`)
        : null,
      el(
        "button",
        { type: "button", class: "btn btn-ghost btn-block", "data-estimate": svc.id },
        season.active ? "Estimate this" : "Join the waitlist"
      )
    );
  }

  function selectSeason(id) {
    activeSeasonId = id;
    const season = seasonById[id];
    // Swaps the photo above the price cards (see #services[data-season] in styles.css).
    $("#services").dataset.season = id;
    document.querySelectorAll(".season-tab").forEach((tab) => {
      tab.setAttribute("aria-selected", String(tab.dataset.season === id));
    });
    $("#service-grid").setAttribute("aria-labelledby", `tab-${id}`);

    const banner = $("#season-banner");
    banner.hidden = season.active;
    banner.textContent = season.active ? "" : season.comingSoonNote || "Coming soon.";

    $("#service-grid").replaceChildren(...servicesFor(id).map((svc) => serviceCard(svc, season)));
  }

  function wireEstimateButtons() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-estimate]");
      if (!btn) return;
      const svc = cfg.services.find((s) => s.id === btn.dataset.estimate);
      if (isBookable(svc)) {
        setEstimatorService(svc.id);
        $("#estimate").scrollIntoView({ behavior: "smooth" });
      } else {
        preselectBooking([svc.id], "Waitlist: " + svc.name);
        $("#book").scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // ---------------------------------------------------------------- hero
  function renderHero() {
    const season = currentSeason();
    const live = season.active ? season : cfg.seasons.find((s) => s.active) || season;
    const featured =
      servicesFor(live.id).find((s) => s.featured) || servicesFor(live.id)[0] || cfg.services[0];
    $("#hero-eyebrow").textContent = `Now booking ${live.label.toLowerCase()} jobs in ${biz.city}`;
    $("#hero-season-icon").textContent = live.icon;
    $("#hero-from-price").textContent = money(startingPrice(featured));
    $("#hero-from-service").textContent = featured.name;
  }

  // ------------------------------------------------------------ estimator
  let lastEstimate = null;

  function renderEstimatorOptions() {
    const select = $("#est-service");
    // Services offered in several seasons are listed once, under the first.
    const seen = new Set();
    const groups = cfg.seasons
      .filter((s) => s.active)
      .map((s) => {
        const fresh = servicesFor(s.id).filter((svc) => !seen.has(svc.id));
        fresh.forEach((svc) => seen.add(svc.id));
        return el(
          "optgroup",
          { label: `${s.icon} ${s.label}` },
          fresh.map((svc) => el("option", { value: svc.id }, svc.name))
        );
      });
    select.replaceChildren(...groups);
    select.onchange = () => setEstimatorService(select.value);
    $("#estimator").addEventListener("input", updateEstimate);
    $("#est-book").onclick = () => {
      if (!lastEstimate) return;
      preselectBooking([lastEstimate.svc.id], lastEstimate.summary);
      $("#book").scrollIntoView({ behavior: "smooth" });
    };
  }

  function numberField(id, label, value, min) {
    return el(
      "label",
      { class: "field" },
      el("span", {}, label),
      el("input", { type: "number", id, min: String(min), value: String(value), inputmode: "numeric" })
    );
  }

  function setEstimatorService(id) {
    const svc = cfg.services.find((s) => s.id === id);
    const p = svc.pricing;
    $("#est-service").value = id;

    const inputs = $("#est-inputs");
    if (p.type === "tiered") {
      inputs.replaceChildren(
        el(
          "label",
          { class: "field" },
          el("span", {}, "Size"),
          el(
            "select",
            { id: "est-tier" },
            p.tiers.map((t, i) => el("option", { value: String(i) }, `${t.label} — ${money(t.price)}`))
          )
        )
      );
      // Default to the middle tier, the most common size.
      $("#est-tier").value = String(Math.floor(p.tiers.length / 2));
    } else if (p.type === "hourly") {
      inputs.replaceChildren(
        el(
          "div",
          { class: "form-row" },
          numberField("est-crew", "Crew members", p.defaultCrew, 1),
          numberField("est-hours", "Hours", p.defaultHours, 1)
        ),
        el("p", { class: "fine" }, `Not sure? Most cleanups take a 2-person crew 2–4 hours. ${money(p.rate)} ${p.unit}.`)
      );
    } else if (p.type === "perUnit") {
      inputs.replaceChildren(
        numberField("est-units", `How many ${p.unit}s?`, p.minUnits, p.minUnits),
        el("p", { class: "fine" }, "Rule of thumb: 1 cubic yard covers about 100 sq ft at 3\" deep. " + (p.note || ""))
      );
    }

    const extras = svc.extras || [];
    $("#est-extras").replaceChildren(
      ...extras.map((x) =>
        x.perUnit
          ? numberField(`est-extra-${x.id}`, `${x.label} — ${money(x.price)} each`, 0, 0)
          : el(
              "label",
              { class: "check" },
              el("input", { type: "checkbox", id: `est-extra-${x.id}` }),
              el("span", {}, `${x.label} (${x.percent ? "+" + x.percent + "%" : "+" + money(x.price)})`)
            )
      )
    );

    const recurringWrap = $("#est-recurring-wrap");
    recurringWrap.hidden = !svc.recurring;
    $("#est-recurring").checked = false;
    if (svc.recurring) {
      $("#est-recurring-label").textContent = `Recurring (${svc.recurring}) — save ${cfg.recurringDiscountPercent}%`;
    }

    updateEstimate();
  }

  function readNumber(id, min) {
    const v = parseInt($(id)?.value, 10);
    return Number.isFinite(v) ? Math.max(min, v) : min;
  }

  function updateEstimate() {
    const svc = cfg.services.find((s) => s.id === $("#est-service").value);
    if (!svc) return;
    const p = svc.pricing;
    let base = 0;
    const parts = [svc.name];

    if (p.type === "tiered") {
      const tier = p.tiers[parseInt($("#est-tier").value, 10)] || p.tiers[0];
      base = tier.price;
      parts.push(tier.label);
    } else if (p.type === "hourly") {
      const crew = readNumber("#est-crew", 1);
      const hours = readNumber("#est-hours", 1);
      const crewHours = Math.max(p.minCrewHours, crew * hours);
      base = crewHours * p.rate;
      parts.push(`${crew} crew × ${hours} hr`);
    } else if (p.type === "perUnit") {
      const units = Math.max(p.minUnits, readNumber("#est-units", 1));
      base = units * p.rate;
      parts.push(`${units} ${p.unit}${units === 1 ? "" : "s"}`);
    }

    let total = base;
    for (const x of svc.extras || []) {
      const input = $(`#est-extra-${x.id}`);
      if (!input) continue;
      if (x.perUnit) {
        const qty = readNumber(`#est-extra-${x.id}`, 0);
        if (qty > 0) {
          total += qty * x.price;
          parts.push(`${qty} ${x.perUnit}${qty === 1 ? "" : "s"} hauled`);
        }
      } else if (input.checked) {
        total += x.percent ? (base * x.percent) / 100 : x.price;
        parts.push(x.label);
      }
    }

    const recurring = svc.recurring && $("#est-recurring").checked;
    if (recurring) {
      total *= 1 - cfg.recurringDiscountPercent / 100;
      parts.push(`recurring (${svc.recurring})`);
    }

    const unit = p.type === "tiered" ? p.unit : "";
    $("#est-total").textContent = money(total) + (unit ? ` ${unit}` : "");
    $("#est-compare").textContent = svc.proRange
      ? `Typical pro crews charge ${svc.proRange} ${svc.proNote || ""}.`
      : "";

    lastEstimate = { svc, total, summary: `${parts.join(" · ")} — est. ${money(total)}${unit ? " " + unit : ""}` };
  }

  // ------------------------------------------------------------- compare
  function renderCompare() {
    $("#compare-body").replaceChildren(
      ...cfg.services
        .filter((s) => s.proRange)
        .map((svc) =>
          el(
            "tr",
            {},
            el(
              "th",
              { scope: "row" },
              svc.name,
              isBookable(svc) ? null : el("span", { class: "badge badge-soon" }, "Soon")
            ),
            el("td", { class: "ours" }, priceSummary(svc)),
            el("td", {}, `${svc.proRange} ${svc.proNote || ""}`)
          )
        )
    );
  }

  // ---------------------------------------------------- crew, area, faq
  function renderLists() {
    $("#crew-list").replaceChildren(
      ...biz.crew.map((m) =>
        el("li", {}, el("span", { class: "avatar", "aria-hidden": "true" }, m.name[0]), el("strong", {}, m.name), el("span", { class: "muted" }, m.role))
      )
    );
    $("#area-list").replaceChildren(...biz.serviceArea.map((a) => el("li", {}, a)));
    $("#faq-list").replaceChildren(
      ...cfg.faq.map((f) => el("details", {}, el("summary", {}, f.q), el("p", {}, f.a)))
    );
  }

  // ------------------------------------------------------------- booking
  function renderBookingServices() {
    $("#booking-services").replaceChildren(
      ...cfg.services.map((svc) =>
        el(
          "label",
          { class: "check" },
          el("input", { type: "checkbox", name: "services", value: svc.id }),
          el("span", {}, svc.name, isBookable(svc) ? null : el("span", { class: "badge badge-soon" }, "Waitlist"))
        )
      )
    );
  }

  function preselectBooking(ids, estimateText) {
    document.querySelectorAll('#booking-services input[name="services"]').forEach((box) => {
      box.checked = ids.includes(box.value);
    });
    $("#booking-estimate").value = estimateText || "";
    const chip = $("#booking-estimate-chip");
    chip.hidden = !estimateText;
    chip.textContent = estimateText || "";
  }

  function wireBooking() {
    const form = $("#booking-form");
    const status = $("#booking-status");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.className = "form-status";
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const chosen = data.getAll("services");
      if (chosen.length === 0) {
        status.textContent = "Pick at least one service so we know what you need.";
        status.classList.add("error");
        return;
      }
      const names = chosen.map((id) => cfg.services.find((s) => s.id === id).name);
      const waitlist = chosen.filter((id) => !isBookable(cfg.services.find((s) => s.id === id)));

      const payload = {
        name: data.get("name"),
        phone: data.get("phone"),
        email: data.get("email"),
        address: data.get("address"),
        services: names.join(", "),
        waitlist: waitlist.length ? "yes" : "no",
        preferredDate: data.get("date") || "flexible",
        bestTime: data.get("time"),
        estimate: data.get("estimate") || "none",
        notes: data.get("notes") || "",
      };

      const subject = `${waitlist.length ? "Waitlist" : "Job request"}: ${names.join(", ")} (${payload.name})`;
      $("#request-box").hidden = true;
      $("#booking-error-detail").hidden = true;
      let failureReason = "";

      if (biz.formEndpoint) {
        const button = $("#booking-submit");
        button.disabled = true;
        status.textContent = "Sending…";
        try {
          // _subject and _replyto are understood by FormSubmit and Formspree:
          // they set the email subject and let you hit Reply to answer the customer.
          const res = await fetch(biz.formEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ ...payload, _subject: subject, _replyto: payload.email, _template: "table" }),
          });
          const result = await res.json().catch(() => ({}));
          // FormSubmit answers 200 with success "false" until the inbox is activated.
          if (!res.ok || String(result.success) === "false") throw new Error(result.message || String(res.status));
          form.reset();
          preselectBooking([], "");
          status.textContent = "Thanks! We got your request and will reach out within 24 hours.";
          status.classList.add("success");
          return;
        } catch (err) {
          // Fall through to the copyable request so the customer isn't stuck,
          // and keep the service's own reason so the problem can be diagnosed.
          failureReason = err instanceof TypeError ? "Could not reach the booking service." : err.message;
          console.error("Booking request failed:", err);
        } finally {
          button.disabled = false;
        }
      }

      // No form backend, or sending failed: show the filled-in request so the
      // customer can copy it into a text or email, or open their email app.
      const body = Object.entries(payload)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      $("#request-text").textContent = body;
      $("#request-mail").href =
        `mailto:${biz.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      $("#request-box").hidden = false;
      const needsActivation = /activat/i.test(failureReason);
      status.textContent = !biz.formEndpoint
        ? `Your request is ready. Copy it and text it to ${biz.phone} or email it to ${biz.email}.`
        : needsActivation
          ? `Our online booking inbox isn't switched on yet. Please copy your request and text it to ${biz.phone} or email it to ${biz.email}.`
          : `We couldn't send your request automatically. Copy it and text it to ${biz.phone} or email it to ${biz.email}.`;
      status.classList.add(biz.formEndpoint ? "error" : "success");
      if (failureReason) {
        const detail = $("#booking-error-detail");
        detail.textContent = `Details: ${failureReason}`;
        detail.hidden = false;
      }
    });

    $("#request-copy").addEventListener("click", async () => {
      const button = $("#request-copy");
      try {
        await navigator.clipboard.writeText($("#request-text").textContent);
        button.textContent = "Copied";
      } catch {
        // Clipboard refused: select the text so the customer can copy it.
        getSelection().selectAllChildren($("#request-text"));
        button.textContent = "Text selected, press Copy";
      }
      setTimeout(() => (button.textContent = "Copy request"), 2500);
    });
  }

  // ---------------------------------------------------------- leaves
  // Leaves drifting down over the hero photo. Skipped for reduced motion,
  // and paused while the hero is off screen.
  function startFallingLeaves() {
    const canvas = $("#hero-leaves");
    if (!canvas || !canvas.getContext) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    const colors = ["#e07a2a", "#c9661f", "#a83f27", "#e3a13c", "#b8572a", "#f0b54a"];
    let width = 0;
    let height = 0;
    let leaves = [];
    let running = true;

    function makeLeaf(randomY) {
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : -30,
        size: 7 + Math.random() * 10,
        fall: 0.35 + Math.random() * 0.75,
        sway: 0.6 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.04,
        angle: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    }

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.round(Math.min(26, Math.max(10, width / 55)));
      leaves = Array.from({ length: count }, () => makeLeaf(true));
    }

    function drawLeaf(leaf) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.angle);
      // Squash horizontally as it turns, so it looks like it's tumbling.
      ctx.scale(Math.cos(leaf.angle * 1.7), 1);
      ctx.fillStyle = leaf.color;
      ctx.beginPath();
      ctx.moveTo(0, -leaf.size);
      ctx.quadraticCurveTo(leaf.size * 0.9, 0, 0, leaf.size);
      ctx.quadraticCurveTo(-leaf.size * 0.9, 0, 0, -leaf.size);
      ctx.fill();
      ctx.strokeStyle = "rgba(60, 25, 8, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -leaf.size);
      ctx.lineTo(0, leaf.size * 1.25);
      ctx.stroke();
      ctx.restore();
    }

    function frame(time) {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      for (const leaf of leaves) {
        leaf.y += leaf.fall;
        leaf.x += Math.sin(time / 900 + leaf.phase) * leaf.sway * 0.5;
        leaf.angle += leaf.spin;
        if (leaf.y > height + 30) Object.assign(leaf, makeLeaf(false));
        drawLeaf(leaf);
      }
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    new IntersectionObserver(([entry]) => {
      const wasRunning = running;
      running = entry.isIntersecting;
      if (running && !wasRunning) requestAnimationFrame(frame);
    }).observe(canvas);
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- init
  function init() {
    bindText();
    activeSeasonId = currentSeason().id;
    renderHero();
    renderTabs();
    selectSeason(activeSeasonId);
    wireEstimateButtons();
    renderEstimatorOptions();
    const firstLive = servicesFor(activeSeasonId).find(isBookable) || cfg.services.find(isBookable);
    if (firstLive) setEstimatorService(firstLive.id);
    renderCompare();
    renderLists();
    renderBookingServices();
    wireBooking();
    startFallingLeaves();
  }

  init();
})();
