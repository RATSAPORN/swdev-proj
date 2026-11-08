const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const paths = {
  arrow: "M4 12h16m-6-6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  compass:
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm4-16-2.5 7.5L6 16l2.5-7.5L16 6Z",
  calendar:
    "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM7 3v4m10-4v4M3 11h18M8 15h2m4 0h2m-8 3h2",
  leaf: "M20 3C8 2 2 8 6 15s16 4 14-12ZM4 21 16 9m-6 6V9m4 2h4",
  user: "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
  search: "M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM16 16l5 5",
  chevron: "m6 9 6 6 6-6",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-16v6l4 2",
  sparkle: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
  grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
  phone:
    "M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2Z",
  check: "m5 12 4 4L19 6",
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.leaf}"/></svg>`;
function icons(root = document) {
  $$("[data-icon]", root).forEach((el) => {
    el.innerHTML = icon(el.dataset.icon);
  });
}
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const state = {
  user: null,
  shops: [],
  services: [],
  reservations: [],
  admin: [],
  filter: "",
  pendingShop: null,
};
const photos = {
  garden: "photo-1540555700478-4be289fbecef",
  room: "photo-1600334129128-685c5582fd35",
  nature: "photo-1544161515-4ab6ce6db874",
  river: "photo-1564540583246-934409427776",
  mali: "photo-1519823551278-64ac92734fb1",
  earth: "photo-1540555700478-4be289fbecef",
};
const image = (shop, width = 700) =>
  `https://images.unsplash.com/${photos[shop.image] || photos.garden}?auto=format&fit=crop&w=${width}&q=80`;
const money = (value) => `฿${Number(value).toLocaleString("en-US")}`;
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const formattedDate = (date) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00+07:00`));
async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "Sabai",
      ...options.headers,
    },
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && state.user) {
      state.user = null;
      state.reservations = [];
      renderAccount();
    }
    throw new Error(
      result.error || "Unable to complete the request. Please try again.",
    );
  }
  return result;
}
let toastTimer;
function toast(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").classList.remove("hidden");
  toastTimer = setTimeout(() => $("#toast").classList.add("hidden"), 5500);
}
const modal = $("#modal");
let previousFocus;
function openModal(content) {
  if (!modal.open) previousFocus = document.activeElement;
  $("#modal-content").innerHTML =
    `<button class="modal-close" type="button" aria-label="Close dialog">${icon("close")}</button>${content}`;
  modal.setAttribute("aria-label", $("h2", modal)?.textContent || "Sabai");
  $(".modal-close").onclick = () => modal.close();
  icons(modal);
  if (!modal.open) modal.showModal();
  setTimeout(
    () =>
      $(
        "input,select,.auth-tabs button,.confirm-actions button",
        modal,
      )?.focus(),
    0,
  );
}
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    const r = modal.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      modal.close();
  }
});
modal.addEventListener("close", () => {
  previousFocus?.focus();
  state.pendingShop = null;
});
function formError(form, message) {
  let el = $(".form-error", form);
  el.textContent = message;
  el.classList.remove("hidden");
}
const errorBox = '<div class="form-error hidden" role="alert"></div>';
function renderAccount() {
  const user = state.user;
  $("#account-name").textContent = user?.name || "Your space awaits";
  $("#account-detail").textContent = user
    ? user.role === "admin"
      ? "Administrator"
      : "Your personal sanctuary"
    : "Sign in to get started";
  $("#top-signin").innerHTML = user
    ? `${escape(user.name.split(" ")[0])} ${icon("user")}`
    : `Sign in ${icon("arrow")}`;
  $("#admin-link").classList.toggle("hidden", user?.role !== "admin");
  $("#logout-button").classList.toggle("hidden", !user);
  const count = state.reservations.filter(
    (r) => new Date(r.endsAt) > new Date(),
  ).length;
  $("#booking-count").textContent = count;
  $("#booking-count").classList.toggle("hidden", !count);
}
function authModal(mode = "login") {
  const register = mode === "register";
  openModal(
    `<div class="modal-body"><div class="modal-eyebrow">WELCOME TO YOUR WELLNESS SPACE</div><h2>${register ? "A little time for you." : "Welcome back."}</h2><p class="modal-intro">${state.pendingShop ? "Sign in or create an account to reserve your moment of calm." : "Your next moment of calm is just a little closer."}</p><div class="auth-tabs"><button type="button" class="${!register ? "active" : ""}" data-auth="login">Sign in</button><button type="button" class="${register ? "active" : ""}" data-auth="register">Create account</button></div><form id="auth-form">${errorBox}${register ? '<label class="field">Full name<input name="name" autocomplete="name" minlength="2" maxlength="80" required placeholder="Your name"></label><label class="field">Telephone number<input name="telephone" type="tel" autocomplete="tel" minlength="8" maxlength="20" required placeholder="081 234 5678"></label>' : ""}<label class="field">Email address<input name="email" type="email" autocomplete="email" maxlength="254" required placeholder="you@example.com"></label><label class="field">Password<input name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" minlength="${register ? 8 : 1}" maxlength="72" required placeholder="${register ? "At least 8 characters" : "Your password"}"></label><button class="button form-submit" type="submit">${register ? "Create your account" : "Sign in"} ${icon("arrow")}</button><p class="modal-fine">A thoughtful pause. No booking fees.<br>Your appointments, all in one place.</p></form></div>`,
  );
  $$("[data-auth]", modal).forEach(
    (b) => (b.onclick = () => authModal(b.dataset.auth)),
  );
  $("#auth-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      button = $("button[type=submit]", form);
    button.disabled = true;
    try {
      const result = await api(`/auth/${register ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      state.user = result.user;
      await loadReservations();
      renderAccount();
      const pending = state.pendingShop;
      modal.close();
      toast(
        register
          ? "Your account is ready. Welcome to Sabai."
          : "Welcome back. Make yourself at home.",
      );
      if (pending) bookingModal(pending);
      else renderPage();
    } catch (error) {
      formError(form, error.message);
    } finally {
      button.disabled = false;
    }
  };
}
function accountAction() {
  if (!state.user) return authModal();
  openModal(
    `<div class="modal-body"><div class="modal-eyebrow">YOUR WELLNESS SPACE</div><h2>Hello, ${escape(state.user.name.split(" ")[0])}.</h2><p class="modal-intro">A little space to call your own.</p><div class="shop-info"><span>${icon("user")} ${escape(state.user.name)}</span><span>${escape(state.user.email)}</span><span>${icon("phone")} ${escape(state.user.telephone)}</span></div><button class="button form-submit" id="account-reservations">View my reservations ${icon("arrow")}</button><button class="text-button" id="account-logout">Sign out</button></div>`,
  );
  $("#account-reservations").onclick = () => {
    modal.close();
    location.hash = "reservations";
  };
  $("#account-logout").onclick = logout;
}
async function logout() {
  try {
    await api("/auth/logout", { method: "POST", body: "{}" });
    state.user = null;
    state.reservations = [];
    state.admin = [];
    if (modal.open) modal.close();
    renderAccount();
    location.hash = "discover";
    renderPage();
    toast("You’re signed out. Come back for a little calm soon.");
  } catch (error) {
    toast(error.message);
  }
}
function renderShops() {
  const query = $("#shop-search").value.trim().toLowerCase(),
    area = $("#area-filter").value;
  const shops = state.shops.filter(
    (s) =>
      (!query ||
        `${s.name} ${s.neighborhood} ${s.address}`
          .toLowerCase()
          .includes(query)) &&
      (!area || s.neighborhood === area) &&
      (!state.filter || s.tags.includes(state.filter)),
  );
  $("#shop-total").textContent =
    `${shops.length} curated space${shops.length === 1 ? "" : "s"}`;
  $("#shop-grid").innerHTML = shops.length
    ? shops
        .map((s, i) => {
          const min = Math.min(
            ...state.services
              .filter((service) => s.tags.includes(service.category))
              .flatMap((service) => Object.values(service.prices)),
          );
          const clock = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Bangkok",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(new Date());
          const open = clock >= s.opens && clock < s.closes;
          return `<article class="shop-card"><div class="card-photo"><img src="${image(s)}" alt="${escape(s.name)} — spa atmosphere" loading="lazy"><span class="photo-chip">${icon("leaf")} ${i === 0 ? "A SABAI FAVORITE" : "SELECTED WITH CARE"}</span><span class="card-number">0${state.shops.indexOf(s) + 1}</span></div><div class="card-body"><div class="shop-meta"><h3>${escape(s.name)}</h3><span><i class="status-dot"></i>${open ? "Open now" : "Opens " + s.opens}</span></div><div class="card-location">${icon("pin")} ${escape(s.neighborhood)}, Bangkok</div><p class="card-license">${icon("check")} License ${escape(s.license || "-")}</p><p class="card-description">${escape(s.description)}</p><div class="tags">${s.tags.map((tag) => `<span>${escape(tag)}</span>`).join("")}</div><div class="card-bottom"><div class="price">From <strong>${money(min)}</strong> <small>/ session</small></div><button class="book-link" data-book="${s._id}">View & reserve ${icon("arrow")}</button></div></div></article>`;
        })
        .join("")
    : `<div class="empty-state"><span>${icon("search")}</span><h2>A little further afield?</h2><p>No shops match these filters. Try another neighborhood or experience.</p><button class="button secondary" id="reset-filters">Clear filters</button></div>`;
  $$("[data-book]").forEach(
    (b) => (b.onclick = () => beginBooking(b.dataset.book)),
  );
  $("#reset-filters")?.addEventListener("click", () => {
    $("#shop-search").value = "";
    $("#area-filter").value = "";
    state.filter = "";
    $$(".filter-chip").forEach((b) =>
      b.classList.toggle("selected", !b.dataset.filter),
    );
    renderShops();
  });
}
function beginBooking(id) {
  if (!state.user) {
    state.pendingShop = id;
    authModal("register");
    return;
  }
  if (
    state.reservations.filter((r) => new Date(r.endsAt) > new Date()).length >=
    3
  ) {
    toast(
      "You have 3 upcoming reservations. Manage your visits to make room for another.",
    );
    location.hash = "reservations";
    return;
  }
  bookingModal(id);
}
function bookingModal(shopId, reservation = null) {
  const shop = state.shops.find((s) => s._id === shopId);
  const available = state.services.filter((s) =>
    shop.tags.includes(s.category),
  );
  openModal(
    `<img class="booking-photo" src="${image(shop)}" alt="Spa atmosphere at ${escape(shop.name)}"><div class="modal-body"><div class="modal-eyebrow">${reservation ? "A LITTLE CHANGE OF PLANS" : "MAKE SPACE FOR YOURSELF"}</div><h2>${escape(shop.name)}</h2><div class="shop-info"><span>${icon("pin")} ${escape(shop.address)}</span><span>${icon("phone")} ${escape(shop.telephone)}</span><span>${icon("clock")} Open daily ${shop.opens}–${shop.closes} · Bangkok time</span><span>${icon("check")} License ${escape(shop.license || "-")}</span></div><form id="booking-form">${errorBox}${reservation ? `<label class="field">Massage shop<select name="shop" id="booking-shop">${state.shops.map((s) => `<option value="${s._id}" ${s._id === shopId ? "selected" : ""}>${escape(s.name)}</option>`).join("")}</select></label>` : ""}<label class="field">Your experience<select name="service" id="booking-service">${available.map((s) => `<option value="${s.id}" ${reservation?.service === s.id ? "selected" : ""}>${escape(s.name)}</option>`).join("")}</select><small id="service-description"></small></label><div class="form-row"><label class="field">Treatment length<select name="duration" id="booking-duration"></select></label><label class="field">Your date<input name="date" id="booking-date" type="date" min="${today()}" value="${reservation?.date || ""}" required></label></div><div class="field">Start time<input type="hidden" name="time" id="booking-time"><div class="time-grid" id="time-grid"></div><small>All times are in Bangkok time (ICT). Please arrive 10 minutes early.</small></div><label class="field">Special requests (Optional)<textarea name="notes" id="booking-notes" rows="2" maxlength="500" placeholder="Preferred masseuse gender, injuries, or areas to avoid...">${escape(reservation?.notes || "")}</textarea></label><div class="booking-summary"><span>Your moment of calm<br><small>Pay directly at the shop</small></span><strong id="booking-price"></strong></div><button class="button form-submit" type="submit">${reservation ? "Save changes" : "Confirm reservation"} ${icon("arrow")}</button><p class="modal-fine">No online payment needed. Up to 3 upcoming reservations.</p></form></div>`,
  );
    const addMinutes = (time, mins) => {
    const t = Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + mins;
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  };
  let timesRequest = 0;
  async function updateTimes() {
    const date = $("#booking-date").value;
    const duration = Number($("#booking-duration").value);
    const selected = $("#booking-time").value || reservation?.time;
    const service = state.services.find(
      (s) => s.id === $("#booking-service").value,
    );
    $("#booking-price").textContent = money(service.prices[duration]);
    const submit = $("button[type=submit]", $("#booking-form"));
    const grid = $("#time-grid");
    const hidden = $("#booking-time");
    const message = (text) => {
      grid.innerHTML = `<p class="time-empty">${text}</p>`;
      hidden.value = "";
      submit.disabled = true;
    };
    if (!date) return message("Choose a date first");
    const request = ++timesRequest;
    message("Loading times…");
    try {
      const query = new URLSearchParams({ date, duration });
      if (reservation?._id) query.set("exclude", reservation._id);
      const { data: slots } = await api(
        `/shops/${shop._id}/availability?${query}`,
      );
      if (request !== timesRequest) return; // ignore stale responses
      const pick =
        slots.find((s) => s.time === selected && s.available)?.time ||
        slots.find((s) => s.available)?.time;
      if (!pick) return message("No times left — choose another date");
      hidden.value = pick;
      submit.disabled = false;
      grid.innerHTML = slots
        .map(
          (s) =>
            `<button type="button" class="time-slot${s.time === pick ? " selected" : ""}" data-time="${s.time}" aria-pressed="${s.time === pick}" ${s.available ? "" : "disabled"}><strong>${s.time}–${addMinutes(s.time, duration)}</strong><small>${s.available ? `${s.remaining} slot${s.remaining === 1 ? "" : "s"} available` : "Fully booked"}</small></button>`,
        )
        .join("");
      $$(".time-slot", grid).forEach(
        (b) =>
          (b.onclick = () => {
            hidden.value = b.dataset.time;
            $$(".time-slot", grid).forEach((x) => {
              x.classList.toggle("selected", x === b);
              x.setAttribute("aria-pressed", x === b);
            });
          }),
      );
    } catch (error) {
      if (request !== timesRequest) return;
      message("Unable to load times");
      formError($("#booking-form"), error.message);
    }
  }
  function updateDurations() {
    const service = state.services.find(
      (s) => s.id === $("#booking-service").value,
    );
    $("#service-description").textContent = service.description;
    $("#booking-duration").innerHTML = Object.keys(service.prices)
      .map(
        (d) =>
          `<option value="${d}" ${Number(d) === reservation?.duration ? "selected" : ""}>${d} minutes</option>`,
      )
      .join("");
    updateTimes();
  }
  $("#booking-service").onchange = updateDurations;
  $("#booking-duration").onchange = updateTimes;
  $("#booking-date").onchange = updateTimes;
  $("#booking-shop")?.addEventListener("change", (e) =>
    bookingModal(e.target.value, {
      ...reservation,
      shop: e.target.value,
      date: $("#booking-date").value,
      time: $("#booking-time").value,
    }),
  );
  updateDurations();
  $("#booking-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      button = $("button[type=submit]", form);
    button.disabled = true;
    const data = Object.fromEntries(new FormData(form));
    data.shop = shopId;
    data.duration = Number(data.duration);
    try {
      await api(
        reservation ? `/reservations/${reservation._id}` : "/reservations",
        { method: reservation ? "PATCH" : "POST", body: JSON.stringify(data) },
      );
      modal.close();
      await loadReservations();
      if (state.user?.role === "admin") await loadAdmin();
      renderAccount();
      if (location.hash !== "#admin") location.hash = "reservations";
      renderPage();
      toast(
        reservation
          ? "Your reservation has been updated."
          : "Your moment of calm is reserved. We’ll see you soon.",
      );
    } catch (error) {
      formError(form, error.message);
    } finally {
      button.disabled = false;
    }
  };
}
async function loadReservations() {
  if (!state.user) return;
  state.reservations = (await api("/reservations")).reservations;
}
async function loadAdmin() {
  if (state.user?.role === "admin")
    state.admin = (await api("/admin/reservations")).reservations;
}
function reservationCards(items, admin = false) {
  return items
    .map((r) => {
      const s = r.shop,
        service = state.services.find((s) => s.id === r.service),
        upcoming = new Date(r.endsAt) > new Date();
      return `<article class="reservation-card"><img src="${image(s, 400)}" alt="${escape(s.name)} spa" loading="lazy"><div class="reservation-detail"><div class="reservation-top"><div><div class="eyebrow">${escape(s.neighborhood)} · BANGKOK</div><h2>${escape(s.name)}</h2></div><span class="reservation-badge">${upcoming ? "Confirmed" : "Completed"}</span></div><p>${escape(service?.name)} · ${r.duration} minutes · ${money(r.price)}</p><p>${icon("calendar")} ${formattedDate(r.date)} &nbsp; ${r.time} ICT</p><p>${icon("pin")} ${escape(s.address)}</p><p>${icon("phone")} ${escape(s.telephone)}</p>${r.notes ? `<div style="margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 6px; font-size: 0.9em;"><strong>Notes:</strong> ${escape(r.notes)}</div>` : ""}${admin ? `<div class="guest-info"><strong>${escape(r.user?.name)}</strong> · ${escape(r.user?.email)} · ${escape(r.user?.telephone)}</div>` : ""}<div class="reservation-actions"><button class="button secondary" data-edit="${r._id}" data-admin="${admin}">Reschedule</button><button class="cancel-button" data-delete="${r._id}" data-admin="${admin}">${upcoming ? "Cancel reservation" : "Delete record"}</button></div></div></article>`;
    })
    .join("");
}
function bindReservationActions(root) {
  $$("[data-edit]", root).forEach(
    (b) =>
      (b.onclick = () => {
        const r = (
          b.dataset.admin === "true" ? state.admin : state.reservations
        ).find((r) => r._id === b.dataset.edit);
        bookingModal(r.shop._id, r);
      }),
  );
  $$("[data-delete]", root).forEach(
    (b) =>
      (b.onclick = () => {
        const r = (
          b.dataset.admin === "true" ? state.admin : state.reservations
        ).find((r) => r._id === b.dataset.delete);
        openModal(
          `<div class="modal-body"><div class="modal-eyebrow">A CHANGE OF PLANS</div><h2>Let this moment go?</h2><p class="modal-intro">Cancel the reservation at ${escape(r.shop.name)} on ${formattedDate(r.date)} at ${r.time}? This will free up a space for your next visit.</p><form id="cancel-form">${errorBox}<div class="confirm-actions"><button type="button" class="button secondary" id="keep-reservation">Keep reservation</button><button type="submit" class="button danger">Yes, cancel</button></div></form></div>`,
        );
        $("#keep-reservation").onclick = () => modal.close();
        $("#cancel-form").onsubmit = async (e) => {
          e.preventDefault();
          const button = $("button[type=submit]", e.currentTarget);
          button.disabled = true;
          try {
            await api(`/reservations/${r._id}`, { method: "DELETE" });
            modal.close();
            await loadReservations();
            await loadAdmin();
            renderAccount();
            renderPage();
            toast(
              "Reservation cancelled. There’s always time for another pause.",
            );
          } catch (error) {
            formError(e.currentTarget, error.message);
          } finally {
            button.disabled = false;
          }
        };
      }),
  );
}
function renderReservations() {
  const root = $("#reservations-content");
  if (!state.user) {
    root.innerHTML = `<div class="empty-state"><span>${icon("calendar")}</span><h2>Your time, all in one place.</h2><p>Sign in to view your reservations, make a little change, or plan your next pause.</p><button class="button" id="reservation-signin">Sign in ${icon("arrow")}</button></div>`;
    $("#reservation-signin").onclick = () => authModal();
    return;
  }
  const upcoming = state.reservations.filter(
    (r) => new Date(r.endsAt) > new Date(),
  ).length;
  root.innerHTML =
    `<div class="reservation-summary"><strong>${upcoming} / 3</strong> upcoming moments of calm<span>${3 - upcoming} reservation${3 - upcoming === 1 ? "" : "s"} available</span></div>` +
    (state.reservations.length
      ? reservationCards(state.reservations)
      : `<div class="empty-state"><span>${icon("leaf")}</span><h2>A little calm is calling.</h2><p>Your next feel-good moment starts with finding your space. Explore our carefully chosen massage shops.</p><a class="button" href="#discover">Discover shops ${icon("arrow")}</a></div>`);
  bindReservationActions(root);
}
function renderAdmin() {
  const root = $("#admin-content");
  if (state.user?.role !== "admin") {
    root.innerHTML =
      '<div class="empty-state"><h2>A private space.</h2><p>Sign in with an administrator account to manage all reservations.</p></div>';
    return;
  }
  const query = $("#admin-search").value.toLowerCase();
  const list = state.admin.filter((r) =>
    `${r.user?.name} ${r.user?.email} ${r.shop.name}`
      .toLowerCase()
      .includes(query),
  );
  root.innerHTML =
    `<div class="reservation-summary"><strong>${list.length}</strong> reservations across all guests<span>Administrator access</span></div>` +
    (list.length
      ? reservationCards(list, true)
      : '<div class="empty-state"><h2>A quiet moment.</h2><p>No reservations found.</p></div>');
  bindReservationActions(root);
}
function renderPage() {
  const requested = location.hash.slice(1),
    page = ["discover", "reservations", "guide", "admin"].includes(requested)
      ? requested
      : "discover";
  $$(".page").forEach((el) =>
    el.classList.toggle("hidden", el.id !== `${page}-page`),
  );
  $$(".nav-item").forEach((el) => {
    const active = el.dataset.page === page;
    el.classList.toggle("active", active);
    if (active) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  $("#breadcrumb-page").textContent = {
    discover: "Discover",
    reservations: "My reservations",
    guide: "How it works",
    admin: "Admin dashboard",
  }[page];
  document.title = `${$("#breadcrumb-page").textContent} — Sabai`;
  if (page === "reservations") renderReservations();
  if (page === "admin") renderAdmin();
}
window.addEventListener("hashchange", async () => {
  renderPage();
  if (location.hash === "#reservations" && state.user) {
    try {
      await loadReservations();
      renderAccount();
      renderReservations();
    } catch (error) {
      toast(error.message);
    }
  }
  if (location.hash === "#admin" && state.user?.role === "admin") {
    try {
      await loadAdmin();
      renderAdmin();
    } catch (error) {
      toast(error.message);
    }
  }
});
$("#account-button").onclick = accountAction;
$("#top-signin").onclick = accountAction;
$("#logout-button").onclick = logout;
$("#shop-search").oninput = renderShops;
$("#area-filter").onchange = renderShops;
$("#admin-search").oninput = renderAdmin;
$$(".filter-chip").forEach(
  (b) =>
    (b.onclick = () => {
      state.filter = b.dataset.filter;
      $$(".filter-chip").forEach((el) =>
        el.classList.toggle("selected", el === b),
      );
      renderShops();
    }),
);
icons();
renderPage();
async function initialize() {
  try {
    const [catalog, auth] = await Promise.all([api("/shops"), api("/auth/me")]);
    state.shops = catalog.data;
    state.services = catalog.services;
    state.user = auth.user;
    $("#area-filter").innerHTML =
      '<option value="">All neighborhoods</option>' +
      state.shops
        .map(
          (s) =>
            `<option value="${escape(s.neighborhood)}">${escape(s.neighborhood)}</option>`,
        )
        .join("");
    renderShops();
    if (state.user) {
      await loadReservations();
      await loadAdmin();
    }
    renderAccount();
    renderPage();
  } catch (error) {
    $("#shop-grid").innerHTML =
      `<div class="empty-state"><h2>A small interruption.</h2><p>${escape(error.message)}</p><button class="button secondary" id="retry-load">Try again</button></div>`;
    $("#retry-load").onclick = initialize;
  }
}
initialize();
