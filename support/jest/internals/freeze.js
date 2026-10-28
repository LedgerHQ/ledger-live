// The one freeze for the presets' exported constant tables: a table and everything it holds.

/**
 * @template T
 * @param {T} value
 * @returns {T} the value, frozen with everything it holds
 */
function deepFreeze(value) {
  if (value && typeof value === "object") Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

module.exports = { deepFreeze };
