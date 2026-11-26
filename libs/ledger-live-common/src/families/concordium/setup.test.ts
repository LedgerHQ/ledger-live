import { createBridges } from "@ledgerhq/coin-concordium/bridge/index";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "../../config/sharedConfig";

jest.mock("@ledgerhq/coin-concordium/bridge/index", () => ({ createBridges: jest.fn() }));
jest.mock("@ledgerhq/live-signer-concordium", () => ({ DmkSignerConcordium: jest.fn() }));

const contextOfTheBridges = async () => {
  await import("./setup");
  const [, context] = jest.mocked(createBridges).mock.calls[0];
  return context;
};

describe("Concordium setup", () => {
  beforeAll(() => LiveConfig.setConfig(liveConfig));
  afterEach(() => LiveConfig.setAllOverrides({}));

  it("should resolve each currency's registered default", async () => {
    const context = await contextOfTheBridges();

    expect(await context.config("concordium")).toMatchObject({
      networkType: "mainnet",
      proxyUrl: "https://ccd-wallet-proxy-mainnet.coin.ledger.com",
      walletConnect: { relayUrl: "wss://relay.walletconnect.com" },
    });
    expect(await context.config("concordium_testnet")).toMatchObject({
      networkType: "testnet",
      proxyUrl: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com",
    });
  });

  it("should read an override at call time", async () => {
    const context = await contextOfTheBridges();

    LiveConfig.setOverride("config_currency_concordium", {
      proxyUrl: "http://127.0.0.1:8080",
      enableTokens: true,
    });

    expect(await context.config("concordium")).toMatchObject({
      proxyUrl: "http://127.0.0.1:8080",
      enableTokens: true,
      walletConnect: { relayUrl: "wss://relay.walletconnect.com" },
    });
  });
});
