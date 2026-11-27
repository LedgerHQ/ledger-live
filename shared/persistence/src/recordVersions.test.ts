import { NewerRecordVersionError, RecordDecodeError } from "./errors";
import { recordVersions } from "./recordVersions";

const KEY = "prefs";

const prefsV0Versions = recordVersions(z => z.strictObject({ theme: z.string() }));

const prefsV1Versions = prefsV0Versions.next(
  z => z.strictObject({ theme: z.string(), fontSize: z.number() }),
  v0 => ({ ...v0, fontSize: 12 }),
);

const prefsVersions = prefsV1Versions.next(
  z => z.strictObject({ theme: z.string(), fontSize: z.number(), compact: z.boolean() }),
  v1 => ({ ...v1, compact: v1.fontSize < 12 }),
);

const caught = (run: () => unknown): unknown => {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error("expected a throw");
};

describe("recordVersions with v0 only", () => {
  it("should have 0 as the latest version when it has no next version", () => {
    expect(prefsV0Versions.latest).toBe(0);
    expect(prefsV0Versions.storedSchemas).toHaveLength(1);
  });

  it("should decode and encode the bare value when the latest version is v0", () => {
    expect(prefsV0Versions.decode({ theme: "dark" }, KEY)).toEqual({ theme: "dark" });
    expect(prefsV0Versions.encode({ theme: "dark" })).toEqual({ theme: "dark" });
  });

  it("should throw a NewerRecordVersionError when a v0 record reads a $v envelope", () => {
    const error = caught(() => prefsV0Versions.decode({ $v: 1, data: { theme: "dark" } }, KEY));
    expect(error).toBeInstanceOf(NewerRecordVersionError);
    expect(error).toMatchObject({ key: KEY, version: 0, storedVersion: 1 });
  });
});

describe("recordVersions with v0, v1 and v2", () => {
  it("should run both steps when the stored value is a bare v0", () => {
    expect(prefsVersions.decode({ theme: "dark" }, KEY)).toEqual({
      theme: "dark",
      fontSize: 12,
      compact: false,
    });
  });

  it("should run the last step only when the stored value is v1", () => {
    expect(prefsVersions.decode({ $v: 1, data: { theme: "dark", fontSize: 10 } }, KEY)).toEqual({
      theme: "dark",
      fontSize: 10,
      compact: true,
    });
  });

  it("should run no step when the stored value is the latest version", () => {
    const latest = { theme: "dark", fontSize: 16, compact: true };
    expect(prefsVersions.decode({ $v: 2, data: latest }, KEY)).toEqual(latest);
  });

  it("should decode the encoded value to the same value when the latest version is v2", () => {
    const latest = { theme: "dark", fontSize: 16, compact: true };
    expect(prefsVersions.decode(prefsVersions.encode(latest), KEY)).toEqual(latest);
  });

  it("should encode the latest version in a $v envelope", () => {
    expect(prefsVersions.latest).toBe(2);
    expect(prefsVersions.encode({ theme: "dark", fontSize: 16, compact: false })).toEqual({
      $v: 2,
      data: { theme: "dark", fontSize: 16, compact: false },
    });
  });

  it("should throw a NewerRecordVersionError before any schema when $v is above the latest", () => {
    const error = caught(() => prefsVersions.decode({ $v: 3, data: "garbage" }, KEY));
    expect(error).toBeInstanceOf(NewerRecordVersionError);
    expect(error).not.toBeInstanceOf(RecordDecodeError);
    expect(error).toMatchObject({ key: KEY, version: 2, storedVersion: 3 });
  });

  it.each([0, -1, 1.5, "1", null])(
    "should throw a RecordDecodeError when $v is %p",
    storedVersion => {
      const stored = { $v: storedVersion, data: { theme: "dark", fontSize: 12 } };
      expect(() => prefsVersions.decode(stored, KEY)).toThrow(RecordDecodeError);
    },
  );

  it("should throw a RecordDecodeError when the envelope has an unknown key", () => {
    const stored = { $v: 1, data: { theme: "dark", fontSize: 12 }, extra: true };
    expect(() => prefsVersions.decode(stored, KEY)).toThrow(RecordDecodeError);
  });

  it("should throw a RecordDecodeError when the bare value does not match the v0 schema", () => {
    expect(() => prefsVersions.decode({ theme: 1 }, KEY)).toThrow(RecordDecodeError);
  });

  it("should leave the receiver unchanged when next adds a version", () => {
    expect(prefsV1Versions.latest).toBe(1);
    expect(prefsV1Versions.storedSchemas).toHaveLength(2);
    expect(prefsVersions.storedSchemas).toHaveLength(3);
    expect(Object.isFrozen(prefsVersions)).toBe(true);
  });

  it("should store each version after v0 in a strict envelope with its $v literal", () => {
    const [, v1Schema, v2Schema] = prefsVersions.storedSchemas;
    const v1 = { $v: 1, data: { theme: "dark", fontSize: 12 } };
    expect(v1Schema?.safeParse(v1).success).toBe(true);
    expect(v1Schema?.safeParse({ ...v1, $v: 2 }).success).toBe(false);
    expect(v2Schema?.safeParse(v1).success).toBe(false);
  });
});

describe("a step that fails", () => {
  it("should throw a RecordDecodeError with no stored value when a step throws", () => {
    const secret = "do-not-log-this";
    const versions = recordVersions(z => z.strictObject({ token: z.string() })).next(
      z => z.strictObject({ token: z.string() }),
      ({ token }) => {
        throw new SyntaxError(token);
      },
    );

    const error = caught(() => versions.decode({ token: secret }, KEY));

    expect(error).toBeInstanceOf(RecordDecodeError);
    expect(error).toMatchObject({ key: KEY, version: 1 });
    expect(String(error)).toContain("the step to v1 threw SyntaxError");
    expect(String(error)).not.toContain(secret);
  });

  it("should throw a RecordDecodeError when the latest schema refuses the result of the steps", () => {
    const versions = recordVersions(z => z.strictObject({ count: z.number() })).next(
      z => z.strictObject({ count: z.number().int() }),
      ({ count }) => ({ count: count / 2 }),
    );

    expect(() => versions.decode({ count: 3 }, KEY)).toThrow(RecordDecodeError);
    expect(versions.decode({ count: 4 }, KEY)).toEqual({ count: 2 });
  });

  it("should refuse a step that does not return the next schema type", () => {
    const versions = recordVersions(z => z.strictObject({ theme: z.string() })).next(
      z => z.strictObject({ theme: z.string(), fontSize: z.number() }),
      // @ts-expect-error the step must give a font size
      v0 => ({ ...v0 }),
    );
    expect(() => versions.decode({ theme: "dark" }, KEY)).toThrow(RecordDecodeError);
  });
});

describe("a schema that throws", () => {
  it("should throw a RecordDecodeError with no stored value when a refinement throws", () => {
    const secret = "do-not-log-this";
    const versions = recordVersions(z => z.strictObject({ token: z.string() })).next(
      z =>
        z.strictObject({
          token: z.string().refine(token => {
            throw new SyntaxError(token);
          }),
        }),
      v0 => v0,
    );

    const error = caught(() => versions.decode({ $v: 1, data: { token: secret } }, KEY));

    expect(error).toBeInstanceOf(RecordDecodeError);
    expect(error).toMatchObject({ key: KEY, version: 1 });
    expect(error).not.toHaveProperty("cause");
    expect(String(error)).toContain("the schema threw SyntaxError");
    expect(String(error)).not.toContain(secret);
  });
});

const decodeMessage = (codes: string) =>
  `Stored value of record "${KEY}" v0 does not match its schema: ${codes}`;

describe("a decode error message", () => {
  const accountId = "js:2:ethereum:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:";

  it("should leave out the dictionary key when a dictionary value is invalid", () => {
    const versions = recordVersions(z => z.record(z.string(), z.number()));

    const error = caught(() => versions.decode({ [accountId]: "1", other: "2" }, KEY));

    expect(error).toBeInstanceOf(RecordDecodeError);
    expect(error).toHaveProperty("message", decodeMessage("invalid_type"));
    expect(String(error)).not.toContain(accountId);
  });

  it("should leave out the dictionary key when the key does not match its schema", () => {
    const versions = recordVersions(z => z.record(z.string().startsWith("js:"), z.number()));

    const error = caught(() => versions.decode({ [`legacy:${accountId}`]: 1 }, KEY));

    expect(error).toHaveProperty("message", decodeMessage("invalid_key"));
    expect(String(error)).not.toContain(accountId);
  });

  it("should leave out the unknown key when a strict object has an unknown key", () => {
    const versions = recordVersions(z => z.strictObject({ theme: z.string() }));

    const error = caught(() => versions.decode({ theme: "dark", [accountId]: true }, KEY));

    expect(error).toHaveProperty("message", decodeMessage("unrecognized_keys"));
    expect(String(error)).not.toContain(accountId);
  });
});

describe("a stored schema", () => {
  it("should refuse a transform to another type when it defines v0", () => {
    // @ts-expect-error the encode writes a number that the schema refuses
    const versions = recordVersions(z => z.string().transform(text => text.length));
    expect(() => versions.decode(versions.encode(4), KEY)).toThrow(RecordDecodeError);
  });

  it("should refuse a transform to another type when next adds a version", () => {
    const versions = recordVersions(z => z.strictObject({ theme: z.string() })).next(
      // @ts-expect-error the encode writes a number that the schema refuses
      z => z.strictObject({ theme: z.string().transform(theme => theme.length) }),
      v0 => ({ theme: v0.theme.length }),
    );
    expect(() => versions.decode(versions.encode({ theme: 4 }), KEY)).toThrow(RecordDecodeError);
  });

  it("should keep the brand and the default in the decoded type when the schema has them", () => {
    const versions = recordVersions(z =>
      z.strictObject({ id: z.string().brand<"PrefsId">(), theme: z.string().default("light") }),
    );
    const latest = versions.decode({ id: "a" }, KEY);
    const theme: string = latest.theme;
    // @ts-expect-error a plain string is not a branded id
    const id: typeof latest.id = "a";
    expect(versions.decode(versions.encode(latest), KEY)).toEqual({ id, theme });
  });
});
