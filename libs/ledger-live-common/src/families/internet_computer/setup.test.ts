import { createBridges } from "@ledgerhq/coin-internet_computer/bridge/index";
import { nodeUrl } from "@ledgerhq/coin-internet_computer/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "../../config/sharedConfig";

jest.mock("@ledgerhq/coin-internet_computer/bridge/index", () => ({ createBridges: jest.fn() }));

const nodeOfTheBridges = async () => {
  await import("./setup");
  const [, context] = jest.mocked(createBridges).mock.calls[0];
  return nodeUrl(await context.config());
};

describe("Internet Computer setup", () => {
  beforeAll(() => LiveConfig.setConfig(liveConfig));
  afterEach(() => LiveConfig.setAllOverrides({}));

  it("should reach mainnet when the coin config names no node", async () => {
    expect(await nodeOfTheBridges()).toBe("https://ic0.app");
  });

  it("should reach the node the coin config names when it names one", async () => {
    LiveConfig.setOverride("config_currency_internet_computer", {
      node: { url: "http://127.0.0.1:4943" },
    });

    expect(await nodeOfTheBridges()).toBe("http://127.0.0.1:4943");
  });
});
