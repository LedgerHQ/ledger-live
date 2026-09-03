import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getAssetInfos } from "../prepareTransaction";
import type { GenericTransaction } from "../types";

const MINT = "63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9";
const OWNER = "7V4CBuNyQaAhZVHf3fgsNxpk32bR61XRVZuAdR7isRu9";
// Solana's legacy sub-account ids end with the token account's own address, not the mint's.
const LEGACY_SUB_ACCOUNT_ID =
  "js:2:solana:xpub:solanaSub+Ctj2Jm9T3igXbp6UDAiRvbso9Um1C4Gt6wHComZ3VC8z";

const token = { id: "solana/spl/giga", contractAddress: MINT } as TokenCurrency;

const getAssetFromToken = (t: TokenCurrency, owner: string): AssetInfo =>
  ({ type: "spl-token", assetReference: t.contractAddress, assetOwner: owner }) as AssetInfo;

const transaction = { subAccountId: LEGACY_SUB_ACCOUNT_ID } as GenericTransaction;

describe("getAssetInfos", () => {
  it("resolves the token from the sub-account when its id predates the framework's format", async () => {
    const account = {
      subAccounts: [{ id: LEGACY_SUB_ACCOUNT_ID, token }],
    } as unknown as Account;

    expect(await getAssetInfos(transaction, OWNER, getAssetFromToken, account)).toEqual({
      assetReference: MINT,
      assetOwner: OWNER,
    });
  });

  it("falls back to a native asset when nothing resolves the token", async () => {
    // Without the account, the id alone yields no token — which used to send an SPL transfer as SOL.
    expect(await getAssetInfos(transaction, OWNER, getAssetFromToken)).toEqual({
      assetReference: "",
      assetOwner: "",
    });
  });
});
