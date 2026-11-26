import {
  containsAccountDescriptors,
  scrubAccountDescriptors,
  scrubAccountDescriptorsFromRecord,
  scrubAccountDescriptorsInPlace,
} from "./accountDescriptor";

const XPUB =
  "xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh";
const ETH_ADDR = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

const UTXO = `account:2:utxo:bitcoin:${XPUB}:m/84h/0h/0h`;
const ADDRESS = `mock:2:address:ethereum:${ETH_ADDR}:m/44h/60h/0h/0/0`;

describe("scrubAccountDescriptors", () => {
  it("redacts every descriptor of a text", () => {
    const text = `Failed to read ${UTXO} then ${ADDRESS}.`;
    expect(scrubAccountDescriptors(text)).toBe("Failed to read [redacted] then [redacted].");
  });

  it("redacts a descriptor in JSON and in a URL", () => {
    const json = JSON.stringify({ descriptor: UTXO });
    expect(scrubAccountDescriptors(json)).toBe('{"descriptor":"[redacted]"}');
    const url = `https://x.test/?d=${encodeURIComponent(ADDRESS)}&n=1`;
    expect(scrubAccountDescriptors(url)).toBe("https://x.test/?d=[redacted]&n=1");
  });

  it("redacts a key that holds a colon", () => {
    expect(scrubAccountDescriptors("account:2:address:hedera:0.0:1:m/44h/3030h/0h/0h/0h")).toBe(
      "[redacted]",
    );
  });

  it("redacts a key with punctuation and a descriptor glued to a word", () => {
    const text = "failed_account:2:address:ethereum:acct#alice:m/44h/60h/0h/0/0 done";
    expect(scrubAccountDescriptors(text)).toBe("failed_[redacted] done");
  });

  it("redacts a descriptor without a valid path: legacy, missing or cut off", () => {
    const legacy = scrubAccountDescriptors("bad account:2:address:ethereum:0xABC:44'/60'/0'/0/0");
    expect(legacy).toBe("bad [redacted]");
    expect(scrubAccountDescriptors(`cut: account:2:utxo:bitcoin:${XPUB.slice(0, 20)}`)).toBe(
      "cut: [redacted]",
    );
  });

  it.each([
    "account:2:address:ethereum:acct,privateSuffix",
    "account:2:address:ethereum:acct,private:44'/60'/0'/0/0",
    "account:2:utxo:bitcoin:acct)private;tail",
  ])("redacts the whole word of a key with punctuation and no valid path: %s", descriptor => {
    expect(scrubAccountDescriptors(`bad ${descriptor} end`)).toBe("bad [redacted] end");
  });

  it("fails closed in JSON text: a descriptor runs up to the last path of the word", () => {
    const json = JSON.stringify({ a: "account:2:address:ethereum:0xabc", b: ADDRESS });
    expect(scrubAccountDescriptors(json)).toBe('{"a":"[redacted]"}');
  });

  it("redacts a version 1 descriptor", () => {
    expect(scrubAccountDescriptors(`bad account:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`)).toBe(
      "bad [redacted]",
    );
  });

  it("leaves other text alone", () => {
    const text = "account 2 of utxo; js:2:ethereum:0xabc: legacy ids are another matter";
    expect(scrubAccountDescriptors(text)).toBe(text);
  });
});

describe("scrubAccountDescriptorsFromRecord", () => {
  const descriptor = {
    purpose: "account",
    type: "utxo",
    network: "bitcoin",
    key: XPUB,
    path: "m/84h/0h/0h",
  };

  it("redacts the key of a descriptor-shaped object and descriptor strings, at any depth", () => {
    const record = { target: { descriptor }, list: [UTXO], count: 1 };
    const redacted = scrubAccountDescriptorsFromRecord(record);
    expect(JSON.stringify(redacted)).not.toContain(XPUB.slice(0, 20));
    expect(redacted).toEqual({
      target: { descriptor: { ...descriptor, key: "[redacted]" } },
      list: ["[redacted]"],
      count: 1,
    });
    expect(record.target.descriptor.key).toBe(XPUB);
  });

  it("sends what JSON would: toJSON values, errors with their fields, and survives cycles", () => {
    const at = new Date(0);
    const amount = { toJSON: () => "1.5" };
    const cause = Object.assign(new Error(`read ${UTXO}`), { status: 503 });
    const record: Record<string, unknown> = { cause, at, amount };
    record.self = record;
    expect(scrubAccountDescriptorsFromRecord(record)).toEqual({
      cause: { name: "Error", message: "read [redacted]", status: 503 },
      at: at.toJSON(),
      amount: "1.5",
      self: "[circular]",
    });
  });

  it("copies an object shared by many paths once", () => {
    let node: Record<string, unknown> = { leaf: UTXO };
    for (let depth = 0; depth < 40; depth++) node = { left: node, right: node };
    const start = Date.now();
    const scrubbed = scrubAccountDescriptorsFromRecord(node);
    expect(Date.now() - start).toBeLessThan(200);
    expect(scrubbed.left).toBe(scrubbed.right);
  });

  it("redacts the key of a partial descriptor", () => {
    expect(scrubAccountDescriptorsFromRecord({ d: { network: "bitcoin", key: XPUB } })).toEqual({
      d: { network: "bitcoin", key: "[redacted]" },
    });
  });

  it("drops the rest of the word that follows a descriptor without a path", () => {
    expect(
      scrubAccountDescriptors("at read(account:2:address:ethereum:0xabc)/app/main.js:10:5 next"),
    ).toBe("at read([redacted] next");
  });

  it("edits in place with the same rules", () => {
    const event = { message: `read ${ADDRESS}`, context: { descriptor: { ...descriptor } } };
    scrubAccountDescriptorsInPlace(event);
    expect(event).toEqual({
      message: "read [redacted]",
      context: { descriptor: { ...descriptor, key: "[redacted]" } },
    });
  });
});

const leaks = (value: unknown) => JSON.stringify(value).includes(XPUB.slice(0, 20));

const shaped = () => ({
  network: "bitcoin",
  key: XPUB,
  path: "m/84h/0h/0h",
  toJSON() {
    return this.key;
  },
});

const captured = () => ({ network: "bitcoin", key: XPUB, toJSON: () => XPUB });

describe("serialization hooks and error names", () => {
  it("scrubs what a toJSON returns, on the root, a nested value and an error", () => {
    const hook = { toJSON: () => ({ d: UTXO }) };
    const error = Object.assign(new Error("e"), { toJSON: () => ({ d: UTXO }) });
    expect(leaks(scrubAccountDescriptorsFromRecord(hook))).toBe(false);
    expect(leaks(scrubAccountDescriptorsFromRecord({ hook, error }))).toBe(false);
  });

  it("scrubs a toJSON hook in place", () => {
    const event = { context: { target: { toJSON: () => ({ d: UTXO }) } } };
    scrubAccountDescriptorsInPlace(event);
    expect(leaks(event)).toBe(false);
  });

  it("scrubs an error's name", () => {
    const error = new Error("e");
    error.name = `Failed ${UTXO}`;
    expect(leaks(scrubAccountDescriptorsFromRecord({ error }))).toBe(false);
    const event = { error };
    scrubAccountDescriptorsInPlace(event);
    expect(event.error).toEqual({ name: "Failed [redacted]", message: "e" });
  });

  it("covers a long key, quotes and a fake path inside the key, up to the last path", () => {
    const tail = ":m/44h/60h/0h/0/0";
    for (const key of [`${"a".repeat(260)},privateSuffix`, "acct'alice", "acct:m/1h:alice"]) {
      expect(scrubAccountDescriptors(`x account:2:address:ethereum:${key}${tail} y`)).toBe(
        "x [redacted] y",
      );
    }
  });

  it("covers quotes, backticks and angle brackets in a key", () => {
    for (const key of ['acct"private', "acct`private", "acct<private>"]) {
      expect(scrubAccountDescriptors(`account:2:address:ethereum:${key}:m/44h/60h/0h/0/0 y`)).toBe(
        "[redacted] y",
      );
    }
  });

  it("ignores the toJSON of a descriptor-shaped object, in both walkers", () => {
    expect(leaks(scrubAccountDescriptorsFromRecord({ d: shaped() }))).toBe(false);
    const event = { d: shaped() };
    scrubAccountDescriptorsInPlace(event);
    expect(leaks(event)).toBe(false);
  });

  it("drops a toJSON that captured the key, in both walkers", () => {
    expect(leaks(scrubAccountDescriptorsFromRecord({ d: captured() }))).toBe(false);
    const event = { d: captured() };
    scrubAccountDescriptorsInPlace(event);
    expect(leaks(event)).toBe(false);
  });

  it("scrubs a Date whose toJSON was overridden, in place", () => {
    const at = Object.assign(new Date(0), { toJSON: () => UTXO });
    const event = { context: { at } };
    scrubAccountDescriptorsInPlace(event);
    expect(leaks(event)).toBe(false);
    expect(JSON.stringify({ d: new Date(0) })).toBe(JSON.stringify({ d: new Date(0).toJSON() }));
  });

  it("scrubs a Date whose toISOString was overridden, and a function carrying a toJSON, in place", () => {
    const at = Object.assign(new Date(0), { toISOString: () => UTXO });
    const hook = Object.assign(() => undefined, { toJSON: () => ({ d: UTXO }) });
    const event = { context: { at, nested: { hook } } };
    scrubAccountDescriptorsInPlace(event);
    expect(leaks(event)).toBe(false);
  });

  it("throws on a hidden toJSON hook in place, and scrubs it in a copy", () => {
    const target: Record<string, unknown> = { note: "n" };
    Object.defineProperty(target, "toJSON", { value: () => UTXO });
    expect(() => scrubAccountDescriptorsInPlace({ context: { target } })).toThrow(
      "Cannot scrub an object with a toJSON hook in place",
    );
    expect(leaks(scrubAccountDescriptorsFromRecord({ target }))).toBe(false);
  });

  it("finds a path whose slashes are escaped in JSON text", () => {
    const text = String.raw`"account:2:address:ethereum:acct,privateSuffix:m\/44h\/60h\/0h\/0\/0" y`;
    expect(scrubAccountDescriptors(text)).toBe('"[redacted]" y');
  });

  it("unboxes a String object before scrubbing it, in both walkers", () => {
    const boxed = { note: Object(UTXO) };
    expect(scrubAccountDescriptorsFromRecord(boxed)).toEqual({ note: "[redacted]" });
    scrubAccountDescriptorsInPlace(boxed);
    expect(leaks(boxed)).toBe(false);
  });

  it("throws on an accessor in place, so the event is dropped", () => {
    const event = {
      get message() {
        return UTXO;
      },
      set message(_value: string) {},
    };
    expect(() => scrubAccountDescriptorsInPlace({ event })).toThrow(
      `Cannot scrub the "message" accessor in place`,
    );
  });

  it("copies an array subclass as a plain array, without its serializer", () => {
    class Leaky extends Array<string> {
      toJSON() {
        return UTXO;
      }
    }
    expect(leaks(scrubAccountDescriptorsFromRecord({ list: Leaky.from(["a"]) }))).toBe(false);
  });

  it("scrubs a non-enumerable array index in place", () => {
    const list: string[] = [];
    Object.defineProperty(list, "0", { value: UTXO, writable: true });
    const event = { list };
    scrubAccountDescriptorsInPlace(event);
    expect(leaks(event)).toBe(false);
  });

  it("drops an enumerable toJSON on an array in place", () => {
    const event = { list: Object.assign(["safe"], { toJSON: () => UTXO }) };
    scrubAccountDescriptorsInPlace(event);
    expect(leaks(event)).toBe(false);
  });

  it("throws on an inherited array index in place, so the event is dropped", () => {
    class Trap extends Array<string> {}
    Object.defineProperty(Trap.prototype, "0", {
      get: () => UTXO,
      set(_value: string) {
        // A setter that ignores the scrubbed value.
      },
    });
    const list = new Trap();
    list.length = 1;
    expect(() => scrubAccountDescriptorsInPlace({ list })).toThrow(
      `Cannot scrub the inherited "0" field in place`,
    );
  });

  it("covers a key holding punctuation up to its path", () => {
    expect(
      scrubAccountDescriptors("account:2:address:ethereum:acct,alice:m/44h/60h/0h/0/0 x"),
    ).toBe("[redacted] x");
  });
});

describe("scrubAccountDescriptorsFromRecord on instances and names", () => {
  it("copies a class instance as a plain object, so its fields are scrubbed too", () => {
    class Target {
      constructor(
        readonly network: string,
        readonly key: string,
        readonly path: string,
        readonly note: string,
      ) {}
    }
    const scrubbed = scrubAccountDescriptorsFromRecord({
      target: new Target("bitcoin", XPUB, "m/84h/0h/0h", `read ${UTXO}`),
    });
    expect(JSON.stringify(scrubbed)).not.toContain(XPUB.slice(0, 20));
  });

  it("scrubs a descriptor used as a property name", () => {
    expect(scrubAccountDescriptorsFromRecord({ [UTXO]: { status: "failed" } })).toEqual({
      "[redacted]": { status: "failed" },
    });
  });
});

describe("scrubAccountDescriptorsInPlace", () => {
  it("scrubs a descriptor used as a property name", () => {
    const event: Record<string, unknown> = { [ADDRESS]: 1 };
    scrubAccountDescriptorsInPlace(event);
    expect(event).toEqual({ "[redacted]": 1 });
  });

  it("swaps an error for its scrubbed name and message, which are not enumerable", () => {
    const event = { context: { error: new Error(`read ${UTXO}`) } };
    scrubAccountDescriptorsInPlace(event);
    expect(event.context.error).toEqual({ name: "Error", message: "read [redacted]" });
  });

  it("leaves a frozen object without a descriptor alone", () => {
    const frozen = Object.freeze({
      note: "n",
      nested: Object.freeze({ key: "[redacted]", path: "p" }),
    });
    expect(() => scrubAccountDescriptorsInPlace({ frozen })).not.toThrow();
  });

  it("keeps the key of an object without a string key or with inherited fields", () => {
    const inherited = Object.assign(Object.create({ network: "bitcoin" }), { key: "k" });
    expect(scrubAccountDescriptorsFromRecord({ a: { key: 1, path: "p" }, inherited })).toEqual({
      a: { key: 1, path: "p" },
      inherited: { key: "k" },
    });
  });

  it("throws on a field it cannot redact, so the caller can drop the event", () => {
    const frozen = Object.freeze({ note: UTXO });
    expect(() => scrubAccountDescriptorsInPlace({ frozen })).toThrow(
      `Cannot scrub the "note" field`,
    );
  });
});

describe("scrubAccountDescriptors delimiters", () => {
  it("prefers redacting up to a later path over leaking part of a key", () => {
    const text = "url?d=account:2:address:ethereum:0xabc&x=1&y=foo:m/44h/60h/0h/0/0 tail";
    expect(scrubAccountDescriptors(text)).toBe("url?d=[redacted] tail");
  });
});

describe("scrubAccountDescriptors on long input", () => {
  it("stays linear on many partial descriptors", () => {
    const text = "account:2:address:x,".repeat(20_000);
    const start = Date.now();
    scrubAccountDescriptors(text);
    expect(Date.now() - start).toBeLessThan(500);
  });
});

describe("containsAccountDescriptors", () => {
  it("tells whether a value holds a descriptor at any depth", () => {
    expect(containsAccountDescriptors([{ message: `read ${UTXO}` }])).toBe(true);
    expect(containsAccountDescriptors({ type: "Error", causes: [] })).toBe(false);
    expect(containsAccountDescriptors(undefined)).toBe(false);
  });
});
