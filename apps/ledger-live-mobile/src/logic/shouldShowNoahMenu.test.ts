import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { shouldShowNoahMenu, NoahRouteProp } from "./shouldShowNoahMenu";

describe("shouldShowNoahMenu", () => {
  const makeRoute = (params?: {
    fromMenu?: boolean;
    currency?: TokenCurrency | CryptoCurrency;
  }): NoahRouteProp => ({
    key: "string",
    name: "params",
    params: { params },
  });

  it("returns false if noahFlagEnabled is false", () => {
    const route = makeRoute();
    expect(shouldShowNoahMenu(route, false)).toBe(false);
  });

  it("returns false if fromMenu is true", () => {
    const route = makeRoute({ fromMenu: true });
    expect(shouldShowNoahMenu(route, true)).toBe(false);
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

    const route = makeRoute({ currency: token });
    expect(shouldShowNoahMenu(route, true)).toBe(true);
  });

  it("returns true if currency is undefined", () => {
    const route = makeRoute();
    expect(shouldShowNoahMenu(route, true)).toBe(true);
  });

  it("returns true if currency is an object with id 'ethereum'", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const currency = { id: "ethereum", family: "evm" } as unknown as CryptoCurrency;

    const route = makeRoute({ currency });
    expect(shouldShowNoahMenu(route, true)).toBe(true);
  });

  it("returns false if currency is an object with id 'bitcoin'", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const currency = { id: "bitcoin", family: "evm" } as unknown as CryptoCurrency;
    const route = makeRoute({ currency });
    expect(shouldShowNoahMenu(route, true)).toBe(false);
  });
});
