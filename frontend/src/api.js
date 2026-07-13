import axios from 'axios';

const BASE = 'http://localhost:3000';
let token = null;

export function setToken(t) { token = t; }
export function getToken() { return token; }

function headers() {
  return { Authorization: `Bearer ${token}` };
}

// Auth
export async function login(email, password) {
  const res = await axios.post(`${BASE}/auth/login`, { email, password }, { withCredentials: true });
  return res.data;
}

export async function register(username, email, password) {
  const res = await axios.post(`${BASE}/auth/register`, { username, email, password });
  return res.data;
}

export async function refresh() {
  const res = await axios.post(`${BASE}/auth/refresh`, {}, { withCredentials: true });
  return res.data;
}

export async function logout() {
  await axios.post(`${BASE}/auth/logout`, {}, { withCredentials: true, headers: headers() });
  token = null;
}

// Watchlist
export async function getWatchlist() {
  const res = await axios.get(`${BASE}/watchlist`, { headers: headers() });
  return res.data;
}

export async function addToWatchlist(symbol) {
  const res = await axios.post(`${BASE}/watchlist`, { symbol }, { headers: headers() });
  return res.data;
}

export async function removeFromWatchlist(id) {
  await axios.delete(`${BASE}/watchlist/${id}`, { headers: headers() });
}

// Alerts
export async function getAlerts() {
  const res = await axios.get(`${BASE}/alerts`, { headers: headers() });
  return res.data;
}

export async function addAlert(symbol, target_price, direction) {
  const res = await axios.post(`${BASE}/alerts`, { symbol, target_price, direction }, { headers: headers() });
  return res.data;
}

export async function deleteAlert(id) {
  await axios.delete(`${BASE}/alerts/${id}`, { headers: headers() });
}

// Holdings
export async function getHoldings() {
  const res = await axios.get(`${BASE}/holdings`, { headers: headers() });
  return res.data;
}

export async function addHolding(symbol, quantity, buy_price, buy_date) {
  const res = await axios.post(`${BASE}/holdings`, { symbol, quantity, buy_price, buy_date }, { headers: headers() });
  return res.data;
}

export async function deleteHolding(id) {
  await axios.delete(`${BASE}/holdings/${id}`, { headers: headers() });
}

// Transcripts
export async function getTranscripts() {
  const res = await axios.get(`${BASE}/transcripts`, { headers: headers() });
  return res.data;
}

export async function uploadTranscript(formData) {
  const res = await axios.post(`${BASE}/transcripts`, formData, {
    headers: { ...headers(), 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function deleteTranscript(id) {
  await axios.delete(`${BASE}/transcripts/${id}`, { headers: headers() });
}

export async function askQuestion(trans_id, question) {
  const res = await axios.post(`${BASE}/transcripts/${trans_id}/question`, { question }, { headers: headers() });
  return res.data;
}
