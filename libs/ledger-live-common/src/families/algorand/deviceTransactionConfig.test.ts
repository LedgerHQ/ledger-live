import type { TokenCurrency } from "@domain/entity-currency-token";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import type { AlgorandGenericTransaction, TransactionStatus } from "./types";

const usdc = { id: "algorand/asa/31566704", name: "USDC" } as TokenCurrency;

beforeAll(() => {
  setCryptoAssetsStore({
    findTokenById: async id => (id === usdc.id ? usdc : undefined),
    findTokenByAddressInCurrency: async () => undefined,
    getTokensSyncHash: async () => "",
  });
});

describe("algorand device transaction config", () => {
  it("shows the opt-in review fields for a changeTrust transaction", async () => {
    const fields = await getDeviceTransactionConfig({
      account: { type: "Account" } as AccountLike,
      transaction: {
        family: "algorand",
        mode: "changeTrust",
        assetReference: "31566704",
      } as AlgorandGenericTransaction,
      status: { estimatedFees: new BigNumber(1000) } as TransactionStatus,
    });

    expect(fields).toEqual([
      { type: "text", label: "Type", value: "Asset xfer" },
      { type: "fees", label: "Fee" },
      { type: "text", label: "Asset ID", value: "USDC (#31566704)" },
      { type: "text", label: "Asset amt", value: "0" },
    ]);
  });
});
