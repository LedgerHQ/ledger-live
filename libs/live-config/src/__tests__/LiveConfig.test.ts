import { LiveConfig, ConfigSchema } from "../LiveConfig";
import { Provider } from "../providers";
import { ConfigInfo } from "../LiveConfig";

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
    } catch (err) {
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
});
