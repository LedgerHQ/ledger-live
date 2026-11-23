const REDACTED = "[redacted]";
const SEP = "(?::|%3A)";
// A path slash as written, percent-encoded or escaped in JSON text (`\/`).
const SLASH = String.raw`(?:/|%2F|\\/)`;
const START = new RegExp(`(?:account|mock)${SEP}2${SEP}(?:utxo|address)${SEP}`, "gi");
const PATH = new RegExp(String.raw`${SEP}m(?:${SLASH}\d+[hH']?)+`, "gi");
// A key may hold any non-space character, so only a space ends the word a path is looked for in.
const TOKEN_END = /\s/;
const KEY_END = /[\s"'`<>,;&?()[\]{}|#]/;

const indexOf = (text: string, from: number, end: RegExp): number => {
  let index = from;
  while (index < text.length && !end.test(text[index])) index++;
  return index;
};

// The end of the last path within [from, to), or -1.
const lastPathEnd = (text: string, from: number, to: number): number => {
  let found = -1;
  PATH.lastIndex = 0;
  const token = text.slice(from, to);
  for (let match = PATH.exec(token); match; match = PATH.exec(token))
    found = from + match.index + match[0].length;
  return found;
};

/**
 * Replaces every account descriptor string of a text (`account:2:<type>:<network>:<key>:<path>`):
 * up to the last path of its word, as a key may hold any punctuation, else up to the next delimiter.
 */
export function scrubAccountDescriptors(text: string): string {
  let scrubbed = "";
  let copied = 0;
  // A range known to hold no path, so that many descriptors in one long word stay linear.
  let pathFreeFrom = 0;
  let pathFreeTo = 0;
  START.lastIndex = 0;
  for (let match = START.exec(text); match; match = START.exec(text)) {
    const keyStart = match.index + match[0].length;
    let end = -1;
    if (keyStart < pathFreeFrom || keyStart >= pathFreeTo) {
      const wordEnd = indexOf(text, keyStart, TOKEN_END);
      end = lastPathEnd(text, keyStart, wordEnd);
      pathFreeFrom = end < 0 ? keyStart : end;
      pathFreeTo = wordEnd;
    }
    if (end < 0) end = indexOf(text, keyStart, KEY_END);
    scrubbed += text.slice(copied, match.index) + REDACTED;
    copied = end;
    START.lastIndex = end;
  }
  return scrubbed + text.slice(copied);
}

// An account descriptor, or part of one, as an object: its `key` is the account key.
const isDescriptorShaped = (value: object): boolean =>
  "key" in value && ("network" in value || "path" in value);

const IN_PROGRESS = Symbol("in progress");
type Copies = WeakMap<object, unknown>;

// What JSON.stringify would send, scrubbed: `toJSON` first, errors as their name, message and fields.
const scrubValue = (value: unknown, copies: Copies): unknown => {
  if (typeof value === "string") return scrubAccountDescriptors(value);
  // A function is dropped, as JSON does, even one carrying a toJSON: failing closed.
  if (typeof value === "function") return undefined;
  if (value === null || typeof value !== "object") return value;
  const known = copies.get(value);
  if (known === IN_PROGRESS) return "[circular]";
  if (known !== undefined) return known;
  copies.set(value, IN_PROGRESS);
  const copy = copyOf(value, copies);
  copies.set(value, copy);
  return copy;
};

// A boxed primitive is sent as its value, as JSON does.
const unboxed = (value: object): unknown => {
  switch (Object.prototype.toString.call(value)) {
    case "[object String]":
      return Reflect.apply(String.prototype.valueOf, value, []);
    case "[object Number]":
      return Reflect.apply(Number.prototype.valueOf, value, []);
    case "[object Boolean]":
      return Reflect.apply(Boolean.prototype.valueOf, value, []);
    default:
      return value;
  }
};

const copyOf = (value: object, copies: Copies): unknown => {
  // A plain array: a subclass could keep a serializer that returns the key.
  if (Array.isArray(value)) return Array.from(value, item => scrubValue(item, copies));
  const boxed = unboxed(value);
  if (boxed !== value) return scrubValue(boxed, copies);
  // A descriptor-shaped object is sent as its scrubbed fields: its own serialization could hold the key.
  if (isDescriptorShaped(value)) return scrubEntries(value, copies);
  const toJSON: unknown = Reflect.get(value, "toJSON");
  if (typeof toJSON === "function") return scrubValue(toJSON.call(value), copies);
  if (value instanceof Error)
    return {
      ...scrubEntries(value, copies),
      name: scrubAccountDescriptors(value.name),
      message: scrubAccountDescriptors(value.message),
    };
  return scrubEntries(value, copies);
};

const scrubEntries = (record: object, copies: Copies): Record<string, unknown> => {
  const shaped = isDescriptorShaped(record);
  // Functions are dropped, as JSON does: a copied `toJSON` could still return the key it captured.
  return Object.fromEntries(
    Object.entries(record)
      .filter(([, value]) => typeof value !== "function")
      .map(([key, value]) => [
        scrubAccountDescriptors(key),
        shaped && key === "key" ? REDACTED : scrubValue(value, copies),
      ]),
  );
};

/** A plain copy of a record without account descriptors, in its strings, its property names or as descriptor-shaped objects. */
export function scrubAccountDescriptorsFromRecord(record: object): Record<string, unknown> {
  const copy = scrubValue(record, new WeakMap());
  return copy !== null && typeof copy === "object" && !Array.isArray(copy)
    ? Object.fromEntries(Object.entries(copy))
    : {};
}

const setOrThrow = (target: object, key: string, value: unknown): void => {
  if (!Reflect.set(target, key, value)) throw new Error(`Cannot scrub the "${key}" field`);
};

// Only plain objects and arrays are walked in place: any other value is swapped for what JSON would send of it.
const isWalkable = (value: object): boolean => {
  if (Array.isArray(value)) return true;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const renameInPlace = (value: object, key: string, item: unknown): string => {
  const scrubbedKey = scrubAccountDescriptors(key);
  if (scrubbedKey === key) return key;
  if (!Reflect.deleteProperty(value, key)) throw new Error("Cannot scrub a field name");
  setOrThrow(value, scrubbedKey, item);
  return scrubbedKey;
};

// An enumerable hook is dropped as a field; a hidden or inherited one would serialize in place of the scrubbed fields.
const assertNoHiddenHook = (value: object): void => {
  const hidden =
    typeof Reflect.get(value, "toJSON") === "function" &&
    !Object.prototype.propertyIsEnumerable.call(value, "toJSON");
  if (hidden) throw new Error("Cannot scrub an object with a toJSON hook in place");
};

// An accessor may ignore the scrubbed value it is given, an inherited field cannot be edited: drop the event instead.
const assertEditable = (value: object, key: string): void => {
  const own = Object.getOwnPropertyDescriptor(value, key);
  if (own?.get || own?.set) throw new Error(`Cannot scrub the "${key}" accessor in place`);
  if (!own && key in value) throw new Error(`Cannot scrub the inherited "${key}" field in place`);
};

const needsJsonCopy = (item: unknown): boolean =>
  typeof item === "function" || (item !== null && typeof item === "object" && !isWalkable(item));

/** The same rules on an object edited in place, for SDK hooks that read the event they were given; throws when a field cannot be scrubbed. */
export function scrubAccountDescriptorsInPlace(value: unknown, seen = new WeakSet<object>()): void {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  assertNoHiddenHook(value);
  const shaped = isDescriptorShaped(value);
  // JSON sends every index of an array, enumerable or not; its other enumerable fields are walked too.
  const indices = Array.isArray(value)
    ? Array.from({ length: value.length }, (_, index) => String(index))
    : [];
  const keys = [...new Set([...indices, ...Object.keys(value)])];
  for (const key of keys) {
    assertEditable(value, key);
    const item: unknown = Reflect.get(value, key);
    const field = renameInPlace(value, key, item);
    if (shaped && key === "key") setOrThrow(value, field, REDACTED);
    else if (typeof item === "string") setOrThrow(value, field, scrubAccountDescriptors(item));
    else if (needsJsonCopy(item)) setOrThrow(value, field, scrubValue(item, new WeakMap()));
    else scrubAccountDescriptorsInPlace(item, seen);
  }
}
