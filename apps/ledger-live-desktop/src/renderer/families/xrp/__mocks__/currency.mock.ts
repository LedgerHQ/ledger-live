import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";

export const xrpTestnetCurrency = getCryptoCurrencyById("ripple_testnet");

export const xrpIouToken: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("ripple_testnet/iou/rlusd"),
  parentCurrencyId: xrpTestnetCurrency.id,
  contractAddress: "rIssuer",
  tokenIdentifier: "524C555344000000000000000000000000000000",
  tokenType: "iou",
  name: "RLUSD",
  ticker: "RLUSD",
  units: [{ name: "RLUSD", code: "RLUSD", magnitude: 0 }],
};

export const xrpMptToken: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("ripple_testnet/mpt/test"),
  parentCurrencyId: xrpTestnetCurrency.id,
  contractAddress: "rIssuer",
  tokenIdentifier: "0000000100000000000000000000000000000000000000AB",
  tokenType: "mpt",
  name: "Test MPT",
  ticker: "TMPT",
  units: [{ name: "Test MPT", code: "TMPT", magnitude: 0 }],
};

// An IOU amount is 16 digits and an exponent: its base unit is 10^-38. The issuer is a valid account,
// as the review step asks the network for its fee.
export const XRP_TOKEN: TokenCurrency = {
  ...xrpIouToken,
  contractAddress: "r9fnpoGUNqCWMppMStPEQY9R4UEbpCek4",
  tokenIdentifier: "524C555344000000000000000000000000000000",
  units: [{ ...xrpIouToken.units[0], magnitude: 38 }],
};
