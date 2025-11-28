import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { shouldShowNoahMenu, NoahParams } from "../shouldShowNoahMenu";

const ACTIVE_CURRENCY_IDS = ["ethereum/erc20/usd__coin"];

describe("shouldShowNoahMenu", () => {
  const makeParams = (params?: {
    fromMenu?: boolean;
    currency?: TokenCurrency | CryptoCurrency;
  }): NoahParams => ({
    fromMenu: params?.fromMenu,
    currency: params?.currency,
  });

  it("returns false if noahFlagEnabled is false", () => {
    const param = makeParams();
    expect(shouldShowNoahMenu(param, false, ACTIVE_CURRENCY_IDS)).toBe(false);
  });

  it("returns false if fromMenu is true", () => {
    const param = makeParams({ fromMenu: true });
    expect(shouldShowNoahMenu(param, true, ACTIVE_CURRENCY_IDS)).toBe(false);
  });

  it("returns true if currency or token id matches the active currency ids", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const token = {
      type: "TokenCurrency",
      id: "ethereum/erc20/usd__coin",
      parentCurrency: {
        family: "evm",
      },
    } as unknown as TokenCurrency;

    const param = makeParams({ currency: token });
    expect(shouldShowNoahMenu(param, true, ACTIVE_CURRENCY_IDS)).toBe(true);
  });

  it("returns true if currency is undefined", () => {
    const param = makeParams();
    expect(shouldShowNoahMenu(param, true, ACTIVE_CURRENCY_IDS)).toBe(true);
  });

  it("returns false if currency or token id does NOT match the active currency ids", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const currency = { id: "bitcoin", family: "evm" } as unknown as CryptoCurrency;
    const param = makeParams({ currency });
    expect(shouldShowNoahMenu(param, true, ACTIVE_CURRENCY_IDS)).toBe(false);
  });
});
