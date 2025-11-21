import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { shouldShowNoahMenu, NoahParams } from "../shouldShowNoahMenu";

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
    expect(shouldShowNoahMenu(param, false)).toBe(false);
  });

  it("returns false if fromMenu is true", () => {
    const param = makeParams({ fromMenu: true });
    expect(shouldShowNoahMenu(param, true)).toBe(false);
  });

  it("returns true if token is ethereum/erc20/usd__coin", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const token = {
      type: "TokenCurrency",
      id: "ethereum/erc20/usd__coin",
      parentCurrency: {
        family: "evm",
      },
    } as unknown as TokenCurrency;

    const param = makeParams({ currency: token });
    expect(shouldShowNoahMenu(param, true)).toBe(true);
  });

  it("returns true if currency is undefined", () => {
    const param = makeParams();
    expect(shouldShowNoahMenu(param, true)).toBe(true);
  });

  it("returns true if currency is an object with id 'ethereum'", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const currency = { id: "ethereum", family: "evm" } as unknown as CryptoCurrency;

    const param = makeParams({ currency });
    expect(shouldShowNoahMenu(param, true)).toBe(true);
  });

  it("returns false if currency is an object with id 'bitcoin'", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const currency = { id: "bitcoin", family: "evm" } as unknown as CryptoCurrency;
    const param = makeParams({ currency });
    expect(shouldShowNoahMenu(param, true)).toBe(false);
  });
});
