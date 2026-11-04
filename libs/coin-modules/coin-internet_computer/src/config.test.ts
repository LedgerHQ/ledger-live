import { type IcpCurrencyConfig, nodeUrl } from "./config";
import { ICP_NETWORK_URL } from "./consts";

const config = (fields: Partial<IcpCurrencyConfig> = {}): IcpCurrencyConfig => ({
  status: { type: "active" },
  name: "Internet Computer",
  unit: { name: "ICP", code: "ICP", magnitude: 8 },
  ...fields,
});

describe("nodeUrl", () => {
  it("is mainnet without a config", () => {
    expect(nodeUrl()).toBe(ICP_NETWORK_URL);
    expect(ICP_NETWORK_URL).toBe("https://ic0.app");
  });

  it("is mainnet when the config names no node", () => {
    expect(nodeUrl(config())).toBe(ICP_NETWORK_URL);
  });

  it("is the node the config names", () => {
    expect(nodeUrl(config({ node: { url: "http://127.0.0.1:4943" } }))).toBe(
      "http://127.0.0.1:4943",
    );
  });

  it("drops trailing slashes, so a broadcast path has no empty segment", () => {
    expect(nodeUrl(config({ node: { url: "http://127.0.0.1:4943//" } }))).toBe(
      "http://127.0.0.1:4943",
    );
  });
});
