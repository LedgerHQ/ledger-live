import { describe, expect, it, jest } from "@jest/globals";
import { InvalidConfigOptionError } from "./errors";
import { resolveAppConfig } from "./resolveAppConfig";
import { defineConfigSchema } from "./schema";

const schema = defineConfigSchema(z => ({
  switches: { backend: { apiUrl: z.url(), authUrl: z.url() } },
  fixed: { clientVersion: z.string().min(1) },
}));

const prodValues = { apiUrl: "https://api.example.com", authUrl: "https://auth.example.com" };
const stagingValues = {
  apiUrl: "https://api.stg.example.com",
  authUrl: "https://auth.stg.example.com",
};

const switches = {
  backend: {
    label: "Backend",
    options: { prod: prodValues, staging: stagingValues },
  },
};

const fixed = { clientVersion: "test/1.0.0" };

/** An in-memory `ConfigStorage` holding what `getAll` returns. */
const createStorage = (selections?: unknown) => ({
  getAll: jest.fn(() => selections),
  set: jest.fn(),
  clear: jest.fn(),
});

describe("resolveAppConfig", () => {
  it.each([
    ["prod", prodValues],
    ["staging", stagingValues],
  ] as const)("resolves each switch to the %s default without selections", (option, values) => {
    expect(
      resolveAppConfig({ schema, default: option, storage: createStorage(), switches, fixed }),
    ).toEqual({ ...values, ...fixed });
  });

  it("resolves each switch to its selected option over the default", () => {
    const storage = createStorage({ backend: "prod" });

    expect(resolveAppConfig({ schema, default: "staging", storage, switches, fixed })).toEqual({
      ...prodValues,
      ...fixed,
    });
    expect(storage.clear).not.toHaveBeenCalled();
  });

  it("falls back to the default and clears the storage for an invalid selection", () => {
    const storage = createStorage({ backend: "unknown option" });

    expect(resolveAppConfig({ schema, default: "staging", storage, switches, fixed })).toEqual({
      ...stagingValues,
      ...fixed,
    });
    expect(storage.clear).toHaveBeenCalledTimes(1);
  });

  it("falls back to the default when the storage can be neither read nor cleared", () => {
    const unavailable = () => {
      throw new ReferenceError("localStorage is not defined");
    };

    expect(
      resolveAppConfig({
        schema,
        default: "staging",
        storage: { getAll: unavailable, set: jest.fn(), clear: unavailable },
        switches,
        fixed,
      }),
    ).toEqual({ ...stagingValues, ...fixed });
  });

  it("ignores selections of unknown switches", () => {
    const storage = createStorage({ unknown: "staging" });

    expect(resolveAppConfig({ schema, default: "prod", storage, switches, fixed })).toEqual({
      ...prodValues,
      ...fixed,
    });
    expect(storage.clear).not.toHaveBeenCalled();
  });

  it("throws when an unselected option does not match the schema", () => {
    const resolve = () =>
      resolveAppConfig({
        schema,
        default: "prod",
        storage: createStorage(),
        switches: {
          backend: {
            label: "Backend",
            options: {
              prod: prodValues,
              staging: { ...stagingValues, apiUrl: "invalid url" },
            },
          },
        },
        fixed,
      });

    expect(resolve).toThrow(InvalidConfigOptionError);
    expect(resolve).toThrow(
      'Option "staging" of config switch "backend" does not match the schema',
    );
  });

  it("throws when a fixed value does not match the schema", () => {
    expect(() =>
      resolveAppConfig({
        schema,
        default: "prod",
        storage: createStorage(),
        switches,
        fixed: { clientVersion: "" },
      }),
    ).toThrow();
  });
});
