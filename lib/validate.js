/**
 * Centralized server-side validation for admin Server Actions.
 *
 * Browser-side `required`/`min`/`max` attributes on <input> are a UX
 * nicety only — they are trivial to bypass (disabled JS, direct fetch to
 * the Server Action, curl, etc). Every one of these must be re-checked
 * here, on the server, before touching the database.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ValidationError extends Error {}

export function requireUuid(value, fieldName = "id") {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw new ValidationError(`${fieldName} tidak valid.`);
  }
  return value;
}

export function requireText(value, { field, min = 1, max = 500 }) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (trimmed.length < min) throw new ValidationError(`${field} wajib diisi.`);
  if (trimmed.length > max) throw new ValidationError(`${field} maksimal ${max} karakter.`);
  return trimmed;
}

export function optionalText(value, { max = 500 } = {}) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > max) throw new ValidationError(`Teks maksimal ${max} karakter.`);
  return trimmed;
}

export function requirePositiveInt(value, { field, min = 0, max = 1_000_000_000 }) {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
    throw new ValidationError(`${field} harus bilangan bulat antara ${min} dan ${max}.`);
  }
  return n;
}

export function requirePrice(value, { field = "Harga", max = 1_000_000_000 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > max) {
    throw new ValidationError(`${field} tidak valid.`);
  }
  return Math.round(n);
}

export function requirePercent(value, { field = "Diskon", max = 90 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > max) {
    throw new ValidationError(`${field} harus antara 0 dan ${max}.`);
  }
  return Math.round(n);
}

export function requireEnum(value, allowed, field = "Nilai") {
  if (!allowed.includes(value)) {
    throw new ValidationError(`${field} tidak valid.`);
  }
  return value;
}

export function requireSizes(values) {
  const allowed = new Set(["S", "M", "L", "XL", "XXL"]);
  const list = Array.isArray(values) ? values.filter((v) => allowed.has(v)) : [];
  return list.length ? list : ["S", "M", "L"];
}

export function requireStockBySize(value, sizes) {
  let parsed;
  try {
    parsed = JSON.parse(String(value || "{}"));
  } catch {
    throw new ValidationError("Stok per ukuran tidak valid.");
  }

  const result = {};
  for (const size of sizes) {
    const stock = Number(parsed?.[size] ?? 0);
    if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) {
      throw new ValidationError(`Stok ukuran ${size} harus bilangan bulat antara 0 dan 1000000.`);
    }
    result[size] = stock;
  }
  return result;
}
