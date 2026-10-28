// Backend API base for materials. Use localhost:3000 in development where backend runs.
// old: export const API = "http://localhost:3000";
// VITE_API_URL wins when it is set. otherwise: port 3000 on the same machine the page came from, so a phone
// that opens http://<laptop-ip>:5173 talks to http://<laptop-ip>:3000 without any extra setting
export const API: string =
  import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`;

