import { LiveConfig, ConfigSchema } from "../LiveConfig";
import { JsonFileReader } from "../providers/jsonFileReader";
import path from "path";

describe("LiveConfig", () => {
  beforeAll(() => {
    const filePath = path.join(__dirname, "config.json");
    const jsonFileReader = new JsonFileReader({ filePath });
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
    };
    LiveConfig.setConfig(config);
    LiveConfig.setProvider(jsonFileReader);
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
});
