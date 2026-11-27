import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Currency } from "@domain/entity-currency";
import { getTokenSupportLink } from "./getTokenSupportLink";
import { urls } from "./urls";

const makeToken = (tokenType: string) => ({ type: "TokenCurrency", tokenType }) as Currency;

describe("getTokenSupportLink", () => {
  it("returns the link of the token standard for a token", () => {
    expect(getTokenSupportLink(makeToken("vip180"))).toEqual(urls.supportLinkByTokenType.vip180);
  });

  it("returns the erc20 link for a crypto currency", () => {
    expect(getTokenSupportLink(getCryptoCurrencyById("ethereum"))).toEqual(
      urls.supportLinkByTokenType.erc20,
    );
  });

  it("returns no link for an unlisted token standard", () => {
    expect(getTokenSupportLink(makeToken("unlisted"))).toBeUndefined();
  });
});
