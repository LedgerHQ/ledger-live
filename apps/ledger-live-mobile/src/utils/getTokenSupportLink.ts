import type { Currency } from "@domain/entity-currency";
import { urls } from "./urls";

const DEFAULT_TOKEN_TYPE = "erc20";

export const getTokenSupportLink = (currency: Currency): string | undefined => {
  const tokenType = currency.type === "TokenCurrency" ? currency.tokenType : DEFAULT_TOKEN_TYPE;
  return urls.supportLinkByTokenType[tokenType as keyof typeof urls.supportLinkByTokenType];
};
