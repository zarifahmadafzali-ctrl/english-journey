export function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatRelativeTime(ts) {
  if (!ts) return "—";
  const diff = ts - Date.now();
  if (diff <= 0) return "Now";
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Local calendar date key (YYYY-MM-DD) based on device local time.
 * Do NOT use toISOString() for daily goal / streak calendar.
 */
export function getLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
