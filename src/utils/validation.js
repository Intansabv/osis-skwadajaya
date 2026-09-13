export function isValidUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeText(text) {
  if (!text) return '';
  return text.trim();
}

export function formatDateTime(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatPercentage(value, total) {
  if (!total || total <= 0) return '0.0%';
  const p = (value / total) * 100;
  return p.toFixed(1) + '%';
}
