import { ConfigSchema, ConfigInfo, LiveConfig } from "../LiveConfig";
import { Provider } from "../providers";

class MockJsonProvider implements Provider {
  getValueByKey(key: string, info: ConfigInfo) {
    const configValue = {
      developer_mode: true,
      app_name: "test app",
      requests_per_seconds: 8,
      explorer: {
        url: "https://myexplorer1.com",
        supportedCurrencies: ["btc", "eth"],
      },
      test_coin: {
        chainId: 23,
        rpc_nodes: {
          first: "https://rpc-node-first.com",
          secondary: "https://rpc-node-secondary.com",
        },
      },
    };

    try {
      return configValue[key] ?? info.default;
    } catch {
      throw new Error(`config key ${key} not found`);
    }
  }
}

describe("LiveConfig", () => {
  beforeAll(() => {
    const jsonProvider = new MockJsonProvider();
    const config: ConfigSchema = {
      app_name: { type: "string", default: "test app" },
      developer_mode: { type: "boolean", default: false },
      requests_per_seconds: { type: "number", default: 8 },
      explorer: {
        type: "object",
        default: {
          url: "https://myexplorer1.com",
          supportedCurrencies: ["btc", "eth"],
        },
      },
      cosmos_config: {
        type: "object",
        default: {
          node: {
            rpc: "https://mycosmosnode.com",
          },
          supportedCurrencies: ["btc", "eth"],
        },
      },
      test_coin: {
        type: "object",
        default: {
          chainId: 25,
          rpc_nodes: {
            main: "https://rpc-node.com",
            other: "https://rpc-node-other.com",
          },
        },
      },
    };

    LiveConfig.setConfig(config);
    LiveConfig.setProvider(jsonProvider);
  });

  it("get correct config from json file", () => {
    const developer_mode = LiveConfig.getValueByKey("developer_mode");
    const app_name = LiveConfig.getValueByKey("app_name");
    const requests_per_seconds = LiveConfig.getValueByKey("requests_per_seconds");
    const explorer = LiveConfig.getValueByKey("explorer");

    expect(app_name).toBe("test app");
    expect(developer_mode).toBe(true);
    expect(requests_per_seconds).toBe(8);
    expect(explorer).toStrictEqual({
      url: "https://myexplorer1.com",
      supportedCurrencies: ["btc", "eth"],
    });
  });

  it("value not set in json file, use default value", () => {
    const cosmos_config = LiveConfig.getValueByKey("cosmos_config");

    expect(cosmos_config).toStrictEqual({
      node: {
        rpc: "https://mycosmosnode.com",
      },
      supportedCurrencies: ["btc", "eth"],
    });
  });

  it("should throw an exception for non-existent keys", () => {
    expect(() => {
      LiveConfig.getValueByKey("value_not_existed");
    }).toThrow();
  });

  it("should deep merge default configuration and provider configuration", () => {
    const test_coin = LiveConfig.getValueByKey("test_coin") as any;

    expect(test_coin.chainId).toBe(23);
    expect(test_coin.rpc_nodes).toStrictEqual({
      first: "https://rpc-node-first.com",
      main: "https://rpc-node.com",
      secondary: "https://rpc-node-secondary.com",
      other: "https://rpc-node-other.com",
    });
  });

  describe("overrides", () => {
    afterEach(() => {
      LiveConfig.setAllOverrides({});
    });

    it("override of a scalar value wins over provider value", () => {
      LiveConfig.setOverride("developer_mode", false);
      expect(LiveConfig.getValueByKey("developer_mode")).toBe(false);
    });

    it("override of an object deep-merges on top of default + provider", () => {
      LiveConfig.setOverride("test_coin", {
        chainId: 999,
        rpc_nodes: { first: "https://override-first.com" },
      });
      const test_coin = LiveConfig.getValueByKey("test_coin") as any;
      expect(test_coin.chainId).toBe(999);
      expect(test_coin.rpc_nodes).toStrictEqual({
        first: "https://override-first.com",
        main: "https://rpc-node.com",
        secondary: "https://rpc-node-secondary.com",
        other: "https://rpc-node-other.com",
      });
    });

    it("clearing a single override falls back to provider value", () => {
      LiveConfig.setOverride("developer_mode", false);
      LiveConfig.setOverride("developer_mode", undefined);
      expect(LiveConfig.getValueByKey("developer_mode")).toBe(true);
    });

    it("setAllOverrides replaces the entire override map", () => {
      LiveConfig.setOverride("developer_mode", false);
      LiveConfig.setAllOverrides({ app_name: "overridden app" });
      expect(LiveConfig.getValueByKey("developer_mode")).toBe(true);
      expect(LiveConfig.getValueByKey("app_name")).toBe("overridden app");
    });

    it("null override of an object config wins instead of being silently merged away", () => {
      LiveConfig.setOverride("test_coin", null);
      expect(LiveConfig.getValueByKey("test_coin")).toBeNull();
    });

    it("primitive override of an object config wins as-is", () => {
      LiveConfig.setOverride("test_coin", "disabled");
      expect(LiveConfig.getValueByKey("test_coin")).toBe("disabled");
    });

    it("array override of an object config wins as-is (not merged)", () => {
      LiveConfig.setOverride("test_coin", [1, 2, 3]);
      expect(LiveConfig.getValueByKey("test_coin")).toEqual([1, 2, 3]);
    });

    it.each([
      ["a Date", new Date(0)],
      ["a class instance", new (class Foo {})()],
      ["a Map", new Map([["k", "v"]])],
    ])("non-plain object override (%s) wins as-is instead of being deep-merged", (_, override) => {
      LiveConfig.setOverride("test_coin", override);
      expect(LiveConfig.getValueByKey("test_coin")).toBe(override);
    });

    it("Object.create(null) override is treated as a plain object and deep-merged", () => {
      const override = Object.create(null) as Record<string, unknown>;
      override.chainId = 999;
      LiveConfig.setOverride("test_coin", override);
      const merged = LiveConfig.getValueByKey("test_coin") as { chainId: number };
      expect(merged.chainId).toBe(999);
      // The deep-merge path must also pull defaults the override didn't set.
      expect(merged).toHaveProperty("rpc_nodes");
    });

    it("getOverrides returns a shallow copy callers cannot use to mutate state", () => {
      LiveConfig.setOverride("developer_mode", false);
      const snapshot = LiveConfig.getOverrides();
      snapshot["developer_mode"] = true;
      snapshot["app_name"] = "leaked";
      expect(LiveConfig.getValueByKey("developer_mode")).toBe(false);
      expect(LiveConfig.getValueByKey("app_name")).toBe("test app");
    });

    describe("prototype-pollution defense", () => {
      const pollutedKey = "polluted_key";

      afterEach(() => {
        // Belt-and-suspenders: scrub any pollution the test attempted to set,
        // so a regression cannot leak into other suites.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (Object.prototype as any)[pollutedKey];
      });

      it.each(["__proto__", "constructor", "prototype"])(
        "setOverride silently refuses %s keys",
        unsafeKey => {
          LiveConfig.setOverride(unsafeKey, { polluted: pollutedKey });
          const snapshot = LiveConfig.getOverrides();
          expect(Object.prototype.hasOwnProperty.call(snapshot, unsafeKey)).toBe(false);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expect((({} as any)[unsafeKey] as any)?.polluted).not.toBe(pollutedKey);
        },
      );

      it("setAllOverrides drops unsafe keys and undefined values", () => {
        LiveConfig.setAllOverrides({
          developer_mode: false,
          // eslint-disable-next-line no-proto, @typescript-eslint/no-explicit-any
          ["__proto__" as string]: { [pollutedKey]: true } as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ["constructor" as string]: "evil" as any,
          shouldBeDropped: undefined,
        });

        const snapshot = LiveConfig.getOverrides();
        expect(snapshot).toEqual({ developer_mode: false });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(({} as any)[pollutedKey]).toBeUndefined();
      });
    });

    describe("without a provider", () => {
      // The outer suite installs a provider in `beforeAll`. Temporarily detach it
      // here so we cover the no-provider branches of `getValueByKey` (overrides
      // applied directly on top of the default).
      let savedProvider: typeof LiveConfig.instance.provider;
      beforeEach(() => {
        savedProvider = LiveConfig.instance.provider;
        LiveConfig.instance.provider = undefined;
      });
      afterEach(() => {
        LiveConfig.instance.provider = savedProvider;
      });

      it("no override returns the raw default value", () => {
        expect(LiveConfig.getValueByKey("developer_mode")).toBe(false);
        expect(LiveConfig.getValueByKey("app_name")).toBe("test app");
      });

      it("scalar override of a scalar config wins over the default", () => {
        LiveConfig.setOverride("developer_mode", true);
        expect(LiveConfig.getValueByKey("developer_mode")).toBe(true);
      });

      it("object override deep-merges with the default when both are plain objects", () => {
        LiveConfig.setOverride("test_coin", {
          chainId: 777,
          rpc_nodes: { main: "https://override-main.com" },
        });
        const test_coin = LiveConfig.getValueByKey("test_coin") as {
          chainId: number;
          rpc_nodes: Record<string, string>;
        };
        expect(test_coin.chainId).toBe(777);
        expect(test_coin.rpc_nodes).toStrictEqual({
          main: "https://override-main.com",
          other: "https://rpc-node-other.com",
        });
      });

      it("non-plain-object override of an object config wins as-is", () => {
        LiveConfig.setOverride("test_coin", null);
        expect(LiveConfig.getValueByKey("test_coin")).toBeNull();

        LiveConfig.setOverride("test_coin", "disabled");
        expect(LiveConfig.getValueByKey("test_coin")).toBe("disabled");
      });
    });

    describe("provider returns nullish", () => {
      // Covers the `??` fallback: when the provider yields `null`/`undefined`,
      // `getValueByKey` must fall back to the schema default before any merge.
      const NullishProvider = { getValueByKey: () => null };
      let savedProvider: typeof LiveConfig.instance.provider;
      beforeEach(() => {
        savedProvider = LiveConfig.instance.provider;
        LiveConfig.instance.provider = NullishProvider;
      });
      afterEach(() => {
        LiveConfig.instance.provider = savedProvider;
      });

      it("returns the schema default for a scalar key when provider yields null", () => {
        expect(LiveConfig.getValueByKey("developer_mode")).toBe(false);
      });

      it("returns the schema default merged with itself for an object key when provider yields null", () => {
        const value = LiveConfig.getValueByKey("test_coin") as { chainId: number };
        // Provider gave null → fallback to default; no override → no second merge.
        expect(value.chainId).toBe(25);
      });
    });
  });

  describe("error and lookup helpers", () => {
    // Independent singleton state: blank out the config so we hit the
    // "Config not set" branches, then restore it for the rest of the suite.
    let savedConfig: ConfigSchema;
    let savedProvider: typeof LiveConfig.instance.provider;
    beforeEach(() => {
      savedConfig = LiveConfig.instance.config;
      savedProvider = LiveConfig.instance.provider;
      LiveConfig.instance.config = {};
      LiveConfig.instance.provider = undefined;
    });
    afterEach(() => {
      LiveConfig.instance.config = savedConfig;
      LiveConfig.instance.provider = savedProvider;
    });

    it("isConfigSet returns false before setConfig and true after", () => {
      expect(LiveConfig.isConfigSet()).toBe(false);
      LiveConfig.setConfig({ x: { type: "string", default: "y" } });
      expect(LiveConfig.isConfigSet()).toBe(true);
    });

    it("getValueByKey throws when config has not been set", () => {
      expect(() => LiveConfig.getValueByKey("anything")).toThrow("Config not set");
    });

    it("getDefaultValueByKey throws when config has not been set", () => {
      expect(() => LiveConfig.getDefaultValueByKey("anything")).toThrow("Config not set");
    });

    it("getDefaultValueByKey returns the schema default once config is set", () => {
      LiveConfig.setConfig({
        token2022Enabled: { type: "boolean", default: false },
      });
      expect(LiveConfig.getDefaultValueByKey("token2022Enabled")).toBe(false);
    });
  });

  describe("setAppinfo", () => {
    it("stores appVersion / platform / environment on the singleton", () => {
      LiveConfig.setAppinfo({
        appVersion: "9.9.9",
        platform: "test",
        environment: "ci",
      });
      expect(LiveConfig.instance.appVersion).toBe("9.9.9");
      expect(LiveConfig.instance.platform).toBe("test");
      expect(LiveConfig.instance.environment).toBe("ci");
    });
  });
});
