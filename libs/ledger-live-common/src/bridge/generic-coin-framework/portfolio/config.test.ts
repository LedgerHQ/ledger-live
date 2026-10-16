import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "../../../config/sharedConfig";
import { mockLiveConfig, portfolioCoinConfig } from "../tests/portfolioFixtures";
import {
  currencyIdOf,
  DEFAULT_PORTFOLIO_ID,
  DEFAULT_PORTFOLIO_SERVICE_URL,
  isPortfolioEnabledFor,
  networkOf,
  portfolioModeFor,
  portfolioModeOf,
  portfolioServiceConfig,
  readPortfolioServiceConfig,
} from "./config";

afterEach(() => jest.restoreAllMocks());

describe("portfolioServiceConfig", () => {
  it("defaults to the test portfolio-service and the ledger-wallet portfolio", () => {
    expect(portfolioServiceConfig).toEqual({
      config_portfolio_service: {
        type: "object",
        default: {
          url: "https://portfolio-service.api.ledger-test.com",
          portfolioId: "ledger-wallet",
        },
      },
    });
    expect(DEFAULT_PORTFOLIO_SERVICE_URL).toBe("https://portfolio-service.api.ledger-test.com");
    expect(DEFAULT_PORTFOLIO_ID).toBe("ledger-wallet");
  });

  it("is part of the shared live config, its default read back when nothing overrides it", () => {
    expect(liveConfig.config_portfolio_service).toBe(
      portfolioServiceConfig.config_portfolio_service,
    );
    LiveConfig.setConfig(liveConfig);
    expect(readPortfolioServiceConfig()).toEqual({
      url: DEFAULT_PORTFOLIO_SERVICE_URL,
      portfolioId: DEFAULT_PORTFOLIO_ID,
    });
  });
});

describe("readPortfolioServiceConfig", () => {
  it("reads the url and the portfolio id", () => {
    mockLiveConfig({
      config_portfolio_service: { url: "https://portfolio.test", portfolioId: "wallet-1" },
    });
    expect(readPortfolioServiceConfig()).toEqual({
      url: "https://portfolio.test",
      portfolioId: "wallet-1",
    });
  });

  it("keeps an empty url, which turns the service off", () => {
    mockLiveConfig({ config_portfolio_service: { url: "" } });
    expect(readPortfolioServiceConfig()).toEqual({ url: "", portfolioId: DEFAULT_PORTFOLIO_ID });
  });

  it.each([
    ["no value", undefined],
    ["values of the wrong type", { url: 42, portfolioId: 7 }],
    ["an empty portfolio id", { url: 42, portfolioId: "" }],
  ])("falls back to the default service and portfolio on %s", (_name, value) => {
    mockLiveConfig({ config_portfolio_service: value });
    expect(readPortfolioServiceConfig()).toEqual({
      url: DEFAULT_PORTFOLIO_SERVICE_URL,
      portfolioId: DEFAULT_PORTFOLIO_ID,
    });
  });
});

describe("network names", () => {
  it("names ripple xrp on the service, and every other currency by its id", () => {
    expect(networkOf("ripple")).toBe("xrp");
    expect(networkOf("bitcoin")).toBe("bitcoin");
    expect(currencyIdOf("xrp")).toBe("ripple");
    expect(currencyIdOf("bitcoin")).toBe("bitcoin");
  });
});

describe("isPortfolioEnabledFor", () => {
  it("follows portfolio.enabled of the coin config", () => {
    mockLiveConfig({
      config_currency_bitcoin: portfolioCoinConfig(),
      config_currency_ripple: { portfolio: { enabled: false, mode: "remote" } },
      config_currency_tezos: { status: { type: "active" } },
    });
    expect(isPortfolioEnabledFor("bitcoin")).toBe(true);
    expect(isPortfolioEnabledFor("ripple")).toBe(false);
    expect(isPortfolioEnabledFor("tezos")).toBe(false);
  });

  it("keeps the legacy bridge for a currency without coin config", () => {
    mockLiveConfig({});
    expect(isPortfolioEnabledFor("bitcoin")).toBe(false);
  });
});

describe("portfolioModeOf", () => {
  it("reads the mode of a network from the coin config of its currency", async () => {
    mockLiveConfig({
      config_currency_ripple: portfolioCoinConfig("remote"),
      config_currency_bitcoin: portfolioCoinConfig("hybrid"),
    });
    await expect(portfolioModeOf("xrp")).resolves.toBe("remote");
    await expect(portfolioModeOf("bitcoin")).resolves.toBe("hybrid");
  });

  it("is local without a mode, a known one, or a coin config", async () => {
    mockLiveConfig({
      config_currency_bitcoin: portfolioCoinConfig(),
      config_currency_ripple: { portfolio: { enabled: true, mode: "elsewhere" } },
    });
    await expect(portfolioModeOf("bitcoin")).resolves.toBe("local");
    await expect(portfolioModeOf("xrp")).resolves.toBe("local");
    await expect(portfolioModeOf("tezos")).resolves.toBe("local");
  });
});

describe("portfolioModeFor", () => {
  it("is the mode of a currency the coin config serves through the portfolio layer", async () => {
    mockLiveConfig({
      config_currency_ripple: portfolioCoinConfig("remote"),
      config_currency_bitcoin: portfolioCoinConfig(),
    });
    await expect(portfolioModeFor("ripple")).resolves.toBe("remote");
    await expect(portfolioModeFor("bitcoin")).resolves.toBe("local");
  });

  it("is none for a currency on the legacy bridge", async () => {
    mockLiveConfig({ config_currency_ripple: { portfolio: { enabled: false, mode: "remote" } } });
    await expect(portfolioModeFor("ripple")).resolves.toBeUndefined();
  });
});
