import { describe, expect, it, jest } from "@jest/globals";
import { InvalidConfigOptionError } from "./errors";
import { validateValue } from "./internals/validateValue";
import { resolveAppConfig } from "./resolveAppConfig";
import { defineConfigSchema } from "./schema";
import type { ConfigOptionId } from "./types";

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

describe("resolveAppConfig", () => {
  it.each([
    ["prod", prodValues],
    ["staging", stagingValues],
  ] as const)("resolves each switch to the %s default without selections", (option, values) => {
    expect(
      resolveAppConfig({ schema, default: option, storage: createStorage(), switches, fixed })
        .config,
    ).toEqual({ ...values, ...fixed });
  });

  it("resolves each switch to its selected option over the default", () => {
    const storage = createStorage({ backend: "prod" });

    expect(
      resolveAppConfig({ schema, default: "staging", storage, switches, fixed }).config,
    ).toEqual({
      ...prodValues,
      ...fixed,
    });
    expect(storage.selections.clear).not.toHaveBeenCalled();
  });

  it("falls back to the default and clears the storage for an invalid selection", () => {
    const storage = createStorage({ backend: "unknown option" });

    expect(
      resolveAppConfig({ schema, default: "staging", storage, switches, fixed }).config,
    ).toEqual({
      ...stagingValues,
      ...fixed,
    });
    expect(storage.selections.clear).toHaveBeenCalledTimes(1);
  });

  it("falls back to the default when the storage can be neither read nor cleared", () => {
    const unavailable = () => {
      throw new ReferenceError("localStorage is not defined");
    };
    const storage = { getAll: unavailable, set: jest.fn(), remove: jest.fn(), clear: unavailable };

    expect(
      resolveAppConfig({
        schema,
        default: "staging",
        storage: { selections: storage, devValues: storage },
        switches,
        fixed,
      }).config,
    ).toEqual({ ...stagingValues, ...fixed });
  });

  it("ignores selections of unknown switches", () => {
    const storage = createStorage({ unknown: "staging" });

    expect(resolveAppConfig({ schema, default: "prod", storage, switches, fixed }).config).toEqual({
      ...prodValues,
      ...fixed,
    });
    expect(storage.selections.clear).not.toHaveBeenCalled();
  });

  it.each(["prod", "staging"] as const)(
    "throws on a %s default when an unselected option does not match the schema",
    defaultOptionId => {
      const resolve = () =>
        resolveAppConfig({
          schema,
          default: defaultOptionId,
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
    },
  );

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

  it("returns what it resolved the configuration from as session", () => {
    const storage = createStorage({ backend: "staging" });

    expect(resolveAppConfig({ schema, default: "prod", storage, switches, fixed }).session).toEqual(
      {
        switches,
        fixed,
        default: "prod",
        selections: { backend: "staging" },
        values: { ...stagingValues, ...fixed },
        devValues: {},
        valueSchemas: schema.values.shape,
        storage,
      },
    );
  });

  it("returns no selection in session when the storage held an invalid one", () => {
    const storage = createStorage({ backend: "https://api.example.com" });

    expect(
      resolveAppConfig({ schema, default: "prod", storage, switches, fixed }).session.selections,
    ).toEqual({});
  });

  describe("dev values", () => {
    const devSchema = defineConfigSchema(z => ({
      switches: {
        explorer: { explorerUrl: z.url() },
        backend: { apiUrl: z.url(), authUrl: z.url() },
      },
      fixed: { clientVersion: z.string().min(1) },
    }));
    const devSwitches = {
      explorer: {
        label: "Explorer",
        options: {
          prod: { explorerUrl: "https://explorer.example.com" },
          staging: { explorerUrl: "https://explorer.stg.example.com" },
        },
      },
      ...switches,
    };

    it("resolves a switch on Dev to the default option with its own dev values on top", () => {
      const storage = createStorage(
        { backend: "dev" },
        { apiUrl: "http://localhost:3000", explorerUrl: "http://localhost:4000" },
      );
      const { config, session } = resolve(storage);

      expect(config).toEqual({
        explorerUrl: "https://explorer.stg.example.com",
        apiUrl: "http://localhost:3000",
        authUrl: stagingValues.authUrl,
        ...fixed,
      });
      expect(session.values).toEqual(config);
    });

    it("resolves a fixed value on Dev to its dev value, or to the fixed value without one", () => {
      expect(
        resolve(createStorage({ clientVersion: "dev" }, { clientVersion: "dev/1.0.0" })).config,
      ).toMatchObject({ clientVersion: "dev/1.0.0" });
      expect(resolve(createStorage({ clientVersion: "dev" })).config).toMatchObject(fixed);
    });

    it("keeps the dev values of what is not on Dev, without applying them", () => {
      const devValues = { apiUrl: "http://localhost:3000", clientVersion: "dev/1.0.0" };
      const { config, session } = resolve(createStorage({}, devValues));

      expect(config).toMatchObject({ ...stagingValues, ...fixed });
      expect(session.devValues).toEqual(devValues);
    });

    it("ignores Dev, and never reads the dev values, when the default is prod", () => {
      const storage = createStorage(
        { backend: "dev", explorer: "staging", clientVersion: "dev" },
        { apiUrl: "http://localhost:3000", clientVersion: "dev/1.0.0" },
      );
      const { config, session } = resolve(storage, "prod");

      expect(config).toEqual({
        explorerUrl: "https://explorer.stg.example.com",
        ...prodValues,
        ...fixed,
      });
      expect(session.selections).toEqual({ explorer: "staging" });
      expect(session.devValues).toEqual({});
      expect(storage.devValues.getAll).not.toHaveBeenCalled();
      expect(storage.selections.clear).not.toHaveBeenCalled();
    });

    it("ignores a selection that a fixed value cannot make", () => {
      const storage = createStorage({ clientVersion: "staging" }, { clientVersion: "dev/1.0.0" });
      const { config, session } = resolve(storage);

      expect(config).toMatchObject(fixed);
      expect(session.selections).toEqual({});
      expect(storage.selections.clear).not.toHaveBeenCalled();
    });

    it.each([
      ["does not match the schema of its value", { apiUrl: "not a url" }],
      ["names no value", { unknownValue: "http://localhost:3000" }],
      ["is an inherited property", { toString: "http://localhost:3000" }],
    ])("ignores a dev value that %s, and keeps it stored", (_, devValues) => {
      const storage = createStorage({ backend: "dev" }, devValues);
      const { config, session } = resolve(storage);

      expect(config).toMatchObject(stagingValues);
      expect(session.devValues).toEqual({});
      expect(storage.devValues.remove).not.toHaveBeenCalled();
      expect(storage.devValues.clear).not.toHaveBeenCalled();
    });

    it.each([
      ["a value that is not a string", { apiUrl: 3000 }],
      ["something else than an object", "http://localhost:3000"],
    ])("clears the dev values when the storage holds %s", (_, devValues) => {
      const storage = createStorage({ backend: "dev" }, devValues);

      expect(resolve(storage).config).toMatchObject(stagingValues);
      expect(storage.devValues.clear).toHaveBeenCalledTimes(1);
    });

    it("validates a dev value with the schema of its value", () => {
      const { valueSchemas } = resolve(createStorage()).session;

      expect(validateValue(valueSchemas, "apiUrl", "http://localhost:3000")).toBeUndefined();
      expect(validateValue(valueSchemas, "apiUrl", "not a url")).toBe("Invalid URL");
      expect(validateValue(valueSchemas, "apiUrl", 3000)).toBe("A dev value must be a string");
      expect(validateValue(valueSchemas, "toString", "value")).toBe(
        '"toString" is not a config value',
      );
    });

    function resolve(
      storage: ReturnType<typeof createStorage>,
      defaultOptionId: ConfigOptionId = "staging",
    ) {
      return resolveAppConfig({
        schema: devSchema,
        default: defaultOptionId,
        storage,
        switches: devSwitches,
        fixed,
      });
    }
  });
});

/** The storage of a boot that reads `selections` and `devValues`. */
function createStorage(selections?: unknown, devValues?: unknown) {
  return {
    selections: createConfigStorage(selections),
    devValues: createConfigStorage(devValues),
  };
}

/** An in-memory `ConfigStorage` holding what `getAll` returns. */
function createConfigStorage(entries?: unknown) {
  return {
    getAll: jest.fn(() => entries),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  };
}
