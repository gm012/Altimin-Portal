// Supabase is the sole business-data source. Only an admin preview ID survives navigation.
(function () {
  "use strict";
  const empty = () => ({ activeClientId:null, clients:[], services:[], hardware:[], requests:[] });
  let memory = empty();
  const copy = value => JSON.parse(JSON.stringify(value));
  // Remove the earlier full-account browser cache, including records from other users.
  try { localStorage.removeItem("altiminPortalV2"); } catch {}
  const context = () => window.AltiminSession?.getContext();
  function previewId() {
    try { return Number(new URL(location.href).searchParams.get("client") ||
      sessionStorage.getItem("altiminAdminPreview")); } catch { return null; }
  }
  function enforce(state) {
    const member = context()?.membership;
    if (!member?.active) return empty();
    if (member.role === "client") {
      const id = Number(member.client_id);
      state.activeClientId = id;
      state.clients = state.clients.filter(c => Number(c.id) === id);
      state.requests = state.requests.filter(r => Number(r.clientId) === id);
    } else if (member.role === "admin") {
      state.activeClientId = previewId() || state.activeClientId || null;
    } else return empty();
    return state;
  }
  function load() { return enforce(copy(memory)); }
  function hydrate(state) {
    memory = enforce(copy(state));
    window.dispatchEvent(new CustomEvent("altiminPortalHydrated"));
    return load();
  }
  function save(state) {
    // Compatibility for existing preview UI; never an API write or authorization source.
    if (context()?.membership?.role === "admin" && state.activeClientId) {
      try { sessionStorage.setItem("altiminAdminPreview", String(state.activeClientId)); } catch {}
    }
    memory = enforce(copy(state));
    window.dispatchEvent(new CustomEvent("altiminPortalUpdated"));
    return load();
  }
  function reset() {
    memory = empty();
    try { sessionStorage.removeItem("altiminAdminPreview"); localStorage.removeItem("altiminPortalV2"); } catch {}
  }
  function getClientById(state,id) { return state.clients.find(c=>Number(c.id)===Number(id)); }
  window.PortalStore = {
    load, hydrate, save, reset, syncFromCache:load, getClientById,
    getActiveClient: state => {
      const member = context()?.membership;
      return getClientById(state, member?.role==="client" ? member.client_id : state.activeClientId);
    },
    getClientServices: (state,id) => state.services.filter(s =>
      (getClientById(state,id)?.serviceIds || []).includes(s.id)),
    getClientRequests: (state,id) => state.requests.filter(r=>Number(r.clientId)===Number(id)),
    formatToday: () => new Intl.DateTimeFormat("en-GB").format(new Date()),
  };
})();
