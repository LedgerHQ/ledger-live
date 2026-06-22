/* eslint-disable no-continue */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable no-prototype-builtins */

const errorClasses = {};
const deserializers = {};

/**
 * @ignore
 * @deprecated Part of the error serialization stack being sunset. Do not register
 * new deserializers. Prefer checking `error.name === "X"` over rebuilding classes —
 * a name comparison works the same before and after a value crosses a boundary.
 */
export const addCustomErrorDeserializer = (name: string, deserializer: (obj: any) => any): void => {
  deserializers[name] = deserializer;
};

/**
 * @ignore
 * @deprecated Type of the legacy `createCustomErrorClass` factory, which is itself
 * deprecated. Do not type new code against it.
 */
export interface LedgerErrorConstructor<
  F extends { [key: string]: unknown },
> extends ErrorConstructor {
  new (message?: string, fields?: F, options?: any): Error & F;
  (message?: string, fields?: F, options?: any): Error & F;
  readonly prototype: Error & F;
}

/**
 * @ignore
 * @deprecated Do not create new error classes with this factory. Define a plain
 * native class instead, in your own package's `src/errors.ts`:
 *
 * ```ts
 * export class MyError extends Error {
 *   override name = "MyError";
 * }
 * ```
 *
 * Check the type with `error.name === "MyError"` (survives serialization) rather
 * than `instanceof`.
 */
export const createCustomErrorClass = <
  F extends { [key: string]: unknown },
  T extends LedgerErrorConstructor<F> = LedgerErrorConstructor<F>,
>(
  name: string,
): T => {
  class CustomErrorClass extends Error {
    cause?: Error;
    constructor(message?: string, fields?: F, options?: any) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      super(message || name, options);
      // Set the prototype explicitly. See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
      Object.setPrototypeOf(this, CustomErrorClass.prototype);
      this.name = name;
      if (fields) {
        for (const k in fields) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          this[k] = fields[k];
        }
      }

      if (options && isObject(options) && "cause" in options && !this.cause) {
        // .cause was specified but the superconstructor
        // did not create an instance property.
        const cause = options.cause;
        this.cause = cause;
        if ("stack" in cause) {
          this.stack = this.stack + "\nCAUSE: " + cause.stack;
        }
      }
    }
  }

  errorClasses[name] = CustomErrorClass;

  return CustomErrorClass as unknown as T;
};

function isObject(value) {
  return typeof value === "object";
}

/**
 * @ignore
 * @deprecated The serialize/deserialize stack is being sunset. Rebuilding a class
 * from a wire object is brittle (it silently degrades to a plain Error for unknown
 * names). Pass `{ name, message }` and branch on `error.name` at the consumer
 * instead.
 */
// inspired from https://github.com/programble/errio/blob/master/index.js
export const deserializeError = (object: any): Error | undefined => {
  if (object && typeof object === "object") {
    try {
      if (typeof object.message === "string") {
        const msg = JSON.parse(object.message);
        if (msg.message && msg.name) {
          object = msg;
        }
      }
    } catch {
      // nothing
    }

    let error;
    if (typeof object.name === "string") {
      const { name } = object;
      const des = deserializers[name];
      if (des) {
        error = des(object);
      } else {
        let constructor = name === "Error" ? Error : errorClasses[name];

        if (!constructor) {
          console.warn("deserializing an unknown class '" + name + "'");
          constructor = createCustomErrorClass(name);
        }

        error = Object.create(constructor.prototype);
        try {
          for (const prop in object) {
            if (object.hasOwnProperty(prop)) {
              error[prop] = object[prop];
            }
          }
        } catch {
          // sometimes setting a property can fail (e.g. .name)
        }
      }
    } else {
      if (typeof object.message === "string") {
        error = new Error(object.message);
      }
    }

    // captureStackTrace is V8/Node-specific and not in @types/node
    const Err = Error as ErrorConstructor & {
      captureStackTrace?(
        targetObject: object,
        constructorOpt?: (...args: unknown[]) => unknown,
      ): void;
    };
    if (error && !error.stack && Err.captureStackTrace) {
      Err.captureStackTrace(error, deserializeError);
    }
    return error;
  }
  return new Error(String(object));
};

/**
 * @ignore
 * @deprecated The serialize/deserialize stack is being sunset. Send a plain
 * `{ name, message }` shape and branch on `error.name` at the consumer instead.
 */
// inspired from https://github.com/sindresorhus/serialize-error/blob/master/index.js
export const serializeError = (
  value: undefined | To | string | (() => unknown),
): undefined | To | string => {
  if (!value) return value;
  if (typeof value === "object") {
    return destroyCircular(value, []);
  }
  if (typeof value === "function") {
    return `[Function: ${value.name || "anonymous"}]`;
  }
  return value;
};

interface To {
  name?: string;
  message?: string;
  stack?: string;
}

// https://www.npmjs.com/package/destroy-circular
function destroyCircular(from: To, seen: Array<To>): To {
  const to: To = {};
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
  if (typeof from.name === "string") {
    to.name = from.name;
  }
  if (typeof from.message === "string") {
    to.message = from.message;
  }
  if (typeof from.stack === "string") {
    to.stack = from.stack;
  }
  return to;
}
