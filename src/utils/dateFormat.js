/**
 * Application-wide date formatting (display: dd/MM/yyyy).
 * HTML date inputs and API payloads use ISO yyyy-MM-dd via toInputDate().
 */

export const DISPLAY_LOCALE = 'en-GB';
export const DATE_DISPLAY_FORMAT = 'dd/MM/yyyy';
export const DATE_INPUT_PLACEHOLDER = 'dd/mm/yyyy';

/**
 * Parse API ISO dates, timestamps, or dd/MM/yyyy (and dd-MM-yyyy) strings.
 */
export function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Display date as dd/MM/yyyy */
export function formatDate(value, fallback = '—') {
  const d = parseDate(value);
  if (!d) return fallback === '' ? '' : fallback;
  return d.toLocaleDateString(DISPLAY_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Display date with short month: dd MMM yyyy */
export function formatDateShort(value, fallback = '—') {
  const d = parseDate(value);
  if (!d) return fallback === '' ? '' : fallback;
  return d.toLocaleDateString(DISPLAY_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Display datetime as dd/MM/yyyy, HH:mm (24h) */
export function formatDateTime(value, fallback = '—') {
  const d = parseDate(value);
  if (!d) return fallback === '' ? '' : fallback;
  if (String(value).includes('T') || String(value).includes(':')) {
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) {
      return asDate.toLocaleString(DISPLAY_LOCALE, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
  }
  return formatDate(value, fallback);
}

/** Convert to yyyy-MM-dd for &lt;input type="date" /&gt; and API */
export function toInputDate(value) {
  const d = parseDate(value);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** @alias */
export const normalizeDateForInput = toInputDate;
