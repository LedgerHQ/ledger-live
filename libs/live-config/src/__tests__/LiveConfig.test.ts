import { LiveConfig, Config } from "../LiveConfig";
import { JsonFileReader } from "../providers/jsonFileReader";
import path from "path";

describe("LiveConfig", () => {
  it("get correct config", () => {
    const filePath = path.join(__dirname, "config.json");
    const jsonFileReader = new JsonFileReader({ filePath });
    const config: Config = {
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

    const liveConfig = new LiveConfig({ provider: jsonFileReader, config: config });

    const developer_mode = liveConfig.getValueByKey("developer_mode");
    const app_name = liveConfig.getValueByKey("app_name");
    const requests_per_seconds = liveConfig.getValueByKey("requests_per_seconds");
    const explorer = liveConfig.getValueByKey("explorer");
    const cosmos_config = liveConfig.getValueByKey("cosmos_config");

    expect(app_name).toBe("test app");
    expect(developer_mode).toBe(true);
    expect(requests_per_seconds).toBe(8);
    expect(explorer).toStrictEqual({
      url: "https://myexplorer1.com",
      supportedCurrencies: ["btc", "eth"],
    });
    expect(cosmos_config).toStrictEqual({
      node: {
        rpc: "https://mycosmosnode.com",
      },
      supportedCurrencies: ["btc", "eth"],
    });
  });
});
