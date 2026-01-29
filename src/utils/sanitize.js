/**
 * Masque des champs sensibles avant envoi dans les logs.
 * - Fonctionne sur objets/arrays (récursif)
 * - Évite les boucles via WeakSet
 */
function sanitizeForLogs(value, opts = {}) {
  const sensitiveFields = (opts.sensitiveFields || [
    'password',
    'token',
    'secret',
    'apiKey',
    'authorization'
  ]).map((k) => String(k).toLowerCase());

  const redacted = opts.redacted || '[REDACTED]';
  const maxDepth = Number.isFinite(opts.maxDepth) ? opts.maxDepth : 5;

  const seen = new WeakSet();

  function walk(v, depth) {
    if (depth > maxDepth) return v;
    if (v === null || v === undefined) return v;

    // Primitives
    const t = typeof v;
    if (t !== 'object') return v;

    // Dates / Buffers etc.
    if (v instanceof Date) return v.toISOString();

    // Arrays
    if (Array.isArray(v)) return v.map((item) => walk(item, depth + 1));

    // Avoid cycles
    if (seen.has(v)) return '[CIRCULAR]';
    seen.add(v);

    const out = {};
    for (const [key, val] of Object.entries(v)) {
      const k = String(key).toLowerCase();
      if (sensitiveFields.includes(k)) {
        out[key] = redacted;
      } else {
        out[key] = walk(val, depth + 1);
      }
    }
    return out;
  }

  return walk(value, 0);
}

module.exports = { sanitizeForLogs };

