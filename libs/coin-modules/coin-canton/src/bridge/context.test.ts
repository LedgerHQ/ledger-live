import { CryptoCurrencyIdSchema } from "@ledgerhq/ledger-wallet-framework/types";
import coinConfig, { type CantonCoinConfig } from "../config";
import { createMockCantonCurrency, createMockCoinConfigValue } from "../test/fixtures";
import { getBridgeConfig, getBridgeContext } from "./context";

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
const cases = [
  { currency: mainnet, expected: mainnetConfig },
  { currency: devnet, expected: devnetConfig },
];

describe("bridge context", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(currencyId => configsByCurrencyId[currencyId ?? ""]);
  });

  it.each(cases)(
    "getBridgeConfig resolves the config of $currency.id",
    ({ currency, expected }) => {
      expect(getBridgeConfig(currency)).toBe(expected);
    },
  );

  it.each(cases)(
    "getBridgeContext resolves the config of $currency.id",
    async ({ currency, expected }) => {
      await expect(getBridgeContext(currency).config()).resolves.toBe(expected);
    },
  );
});
