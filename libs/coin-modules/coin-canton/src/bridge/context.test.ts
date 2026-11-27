import { CryptoCurrencyIdSchema } from "@ledgerhq/ledger-wallet-framework/types";
import { pinConfig, type CantonCoinConfig, type CantonContext } from "../config";
import { createMockCantonCurrency, createMockCoinConfigValue } from "../test/fixtures";
import { getCurrencyContext } from "./context";

const mainnet = createMockCantonCurrency();
const devnet = { ...mainnet, id: CryptoCurrencyIdSchema.parse("canton_network_devnet") };
const mainnetConfig: CantonCoinConfig = {
  ...createMockCoinConfigValue(),
  gatewayUrl: "https://mainnet.test",
};
const devnetConfig: CantonCoinConfig = {
  ...createMockCoinConfigValue(),
  gatewayUrl: "https://devnet.test",
};
const configsByCurrencyId: Record<string, CantonCoinConfig> = {
  [mainnet.id]: mainnetConfig,
  [devnet.id]: devnetConfig,
};
const logger = jest.fn();
const bridgeContext: CantonContext = {
  config: async currencyId => configsByCurrencyId[currencyId ?? ""],
  logger,
};
const cases = [
  { currency: mainnet, expected: mainnetConfig },
  { currency: devnet, expected: devnetConfig },
];

describe("getCurrencyContext", () => {
  it.each(cases)("resolves the config of $currency.id", async ({ currency, expected }) => {
    const context = await getCurrencyContext(bridgeContext, currency);

    await expect(context.config()).resolves.toBe(expected);
  });

  it("resolves the config once, whatever currency is asked for later", async () => {
    const context = await getCurrencyContext(bridgeContext, mainnet);

    await expect(context.config(devnet.id)).resolves.toBe(mainnetConfig);
  });

  it("keeps the bridge logger", async () => {
    expect((await getCurrencyContext(bridgeContext, mainnet)).logger).toBe(logger);
  });
});

describe("pinConfig", () => {
  it("resolves the pinned config whatever currency is asked for", async () => {
    await expect(pinConfig(bridgeContext, mainnetConfig).config(devnet.id)).resolves.toBe(
      mainnetConfig,
    );
  });

  it("keeps the bridge logger", () => {
    expect(pinConfig(bridgeContext, mainnetConfig).logger).toBe(logger);
  });
});
