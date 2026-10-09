import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAssetInfos } from "../../../bridge/generic-coin-framework/prepareTransaction";
import type { GenericTransaction } from "../../../bridge/generic-coin-framework/types";
import { transactionToIntent } from "../../../bridge/generic-coin-framework/utils";
import { getAssetFromToken, getTokenFromAsset } from "./api";

const asaToken = {
  type: "TokenCurrency",
  id: "algorand/asa/31566704",
  contractAddress: "31566704",
  parentCurrencyId: "algorand",
  tokenType: "asa",
  name: "USDC",
  ticker: "USDC",
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
} as unknown as TokenCurrency;

beforeAll(() => {
  setCryptoAssetsStore({
    findTokenById: async id => (id === asaToken.id ? asaToken : undefined),
    findTokenByAddressInCurrency: async () => undefined,
    getTokensSyncHash: async () => "",
  });
});

describe("algorand bridge api", () => {
  it("maps a token to an ASA asset owned by the holder", () => {
    expect(getAssetFromToken(asaToken, "OWNER")).toEqual({
      type: "asa",
      assetReference: "31566704",
      assetOwner: "OWNER",
      name: "USDC",
      unit: asaToken.units[0],
    });
  });

  it("maps the asset back to the same token", async () => {
    await expect(getTokenFromAsset(getAssetFromToken(asaToken, "OWNER"))).resolves.toBe(asaToken);
  });

  it("builds an ASA intent for a sub-account send", async () => {
    const account = genAccount("algorand-asa", { currency: getCryptoCurrencyById("algorand") });
    const subAccount = { type: "TokenAccount", id: "sub", token: asaToken } as TokenAccount;
    account.subAccounts = [subAccount];
    const transaction: GenericTransaction = {
      family: "algorand",
      mode: "send",
      amount: new BigNumber(1),
      recipient: "RECIPIENT",
      subAccountId: "sub",
    };

    const assetInfos = await getAssetInfos(
      transaction,
      account.freshAddress,
      getAssetFromToken,
      account,
    );
    const intent = transactionToIntent(account, { ...transaction, ...assetInfos });

    expect(intent.asset).toMatchObject({
      assetReference: "31566704",
      assetOwner: account.freshAddress,
    });
  });
});
