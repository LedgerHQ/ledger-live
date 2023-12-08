import { LiveConfig } from "../LiveConfig";
import { JsonFileReader } from "../providers/jsonFileReader";
import path from "path";

describe("LiveConfig", () => {
  it("get correct config", () => {
    const liveConfig = new LiveConfig({
      appVersion: "0.0.0",
      platform: "vm",
      environment: "jest",
      provider: new JsonFileReader({ filePath: path.join(__dirname, "./config.json") }),
      config: {
        developer_mode: {
          type: "boolean",
          default: true,
        },
        currency_mycoin: {
          type: "enabled",
          default: { enabled: true },
        },
        highest_market_cap: {
          type: "array",
          default: ["btc", "eth"],
        },
        app_name: {
          type: "string",
          default: "ledger live",
        },
        requests_per_seconds: {
          type: "number",
          default: 10,
        },
        explorer: {
          type: "object",
          default: {
            url: "https://myexplorer.com",
            supportedCurrencies: ["btc", "eth"],
          },
        },
      },
    });

    const developer_mode = liveConfig.getValueByKey("developer_mode");
    const app_name = liveConfig.getValueByKey("app_name");
    const requests_per_seconds = liveConfig.getValueByKey("requests_per_seconds");
    const explorer = liveConfig.getValueByKey("explorer");

    expect(app_name).toBe("test app");
    expect(developer_mode).toBe(true);
    expect(requests_per_seconds).toBe(8);
    expect(explorer).toStrictEqual({
      url: "https://myexplorer.com",
      supportedCurrencies: ["btc", "eth"],
    });
  });
});
