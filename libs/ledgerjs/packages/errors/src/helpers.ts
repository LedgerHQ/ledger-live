/* eslint-disable no-continue */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable no-prototype-builtins */

const errorClasses = {};
const deserializers = {};

export const addCustomErrorDeserializer = (name: string, deserializer: (obj: any) => any): void => {
  deserializers[name] = deserializer;
};

export interface LedgerErrorConstructor<F extends { [key: string]: unknown }>
  extends ErrorConstructor {
  new (message?: string, fields?: F, options?: any): Error;
  (message?: string, fields?: F, options?: any): Error;
  readonly prototype: Error;
}

export const createCustomErrorClass = <
  F extends { [key: string]: unknown },
  T extends LedgerErrorConstructor<F>,
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
      if (options && isObject(options) && "cause" in options && !("cause" in this)) {
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
    } catch (e) {
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
        } catch (e) {
          // sometimes setting a property can fail (e.g. .name)
        }
      }
    } else {
      if (typeof object.message === "string") {
        error = new Error(object.message);
      }
    }

    if (error && !error.stack && Error.captureStackTrace) {
      Error.captureStackTrace(error, deserializeError);
    }
    return error;
  }
  return new Error(String(object));
};

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
