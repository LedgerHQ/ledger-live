type To =
  | {
      name?: string;
      message?: string;
      stack?: string;
    }
  | [];

// https://www.npmjs.com/package/destroy-circular
function destroyCircular(from: To, seen: Array<To>): To {
  const to: To = Array.isArray(from) ? [] : {};
  seen.push(from);
  for (const key of Object.keys(from)) {
    const value = from[key];
    if (typeof value === "function") {
      continue;
    }
    if (!value || typeof value !== "object") {
      to[key] = value;
      continue;
    }
    if (seen.indexOf(from[key]) === -1) {
      to[key] = destroyCircular(from[key], seen.slice(0));
      continue;
    }
    to[key] = "[Circular]";
  }
  if (!Array.isArray(from) && !Array.isArray(to)) {
    if (typeof from.name === "string") {
      to.name = from.name;
    }
    if (typeof from.message === "string") {
      to.message = from.message;
    }
    if (typeof from.stack === "string") {
      to.stack = from.stack;
    }
  }
  return to;
}

/**
 * Extract every property of the error passed in parameter
 * It does not include default properties: cause, message and name
 * And also null, undefined or Circular error (error linked to itself)
 *
 * @param error the error to parse
 *
 * @return A record of attributes mapped to their value
 */
export function extractErrorContext(error: Error): Record<string, unknown> {
  const sanitizedError = destroyCircular(error, []);
  const context: Record<string, unknown> = {};

  Object.keys(sanitizedError)
    .filter(key => {
      if (key === "message" || key === "name" || key === "stack") {
        return false;
      }

      const value = sanitizedError[key];
      return value !== null && value !== undefined && value !== "[Circular]";
    })
    .forEach(key => {
      context[key] = sanitizedError[key];
    });

  return context;
}
