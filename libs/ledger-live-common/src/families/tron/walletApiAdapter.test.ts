import type { Account } from "@ledgerhq/types-live";
import type { TronTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";
import tron from "./walletApiAdapter";

const walletApiTx = (extra: Partial<WalletAPITransaction> = {}): WalletAPITransaction => ({
  family: "tron",
  mode: "send",
  amount: new BigNumber(1000000),
  recipient: "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8",
  votes: [],
  ...extra,
});

const signFlowInfos = (transaction: WalletAPITransaction) =>
  tron.getWalletAPITransactionSignFlowInfos({
    walletApiTransaction: transaction,
    account: {} as Account,
  });

describe("tron getWalletAPITransactionSignFlowInfos", () => {
  it("passes a plain send through with no familySpecificData", () => {
    const { canEditFees, hasFeesProvided, liveTx } = signFlowInfos(walletApiTx());

    expect(canEditFees).toBe(false);
    expect(hasFeesProvided).toBe(false);
    expect(liveTx).toEqual({
      family: "tron",
      mode: "send",
      amount: new BigNumber(1000000),
      recipient: "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8",
    });
  });

  it("moves the freeze resource into familySpecificData, where buildIntentData reads it", () => {
    const { liveTx } = signFlowInfos(walletApiTx({ mode: "freeze", resource: "ENERGY" }));

    expect(liveTx.mode).toBe("freeze");
    expect(liveTx.familySpecificData).toEqual({ resource: "ENERGY" });
    // The top-level field must not survive: nothing downstream reads it, and leaving it would make the
    // transaction disagree with itself.
    expect(liveTx).not.toHaveProperty("resource");
  });

  it("carries the freeze duration", () => {
    const { liveTx } = signFlowInfos(
      walletApiTx({ mode: "freeze", resource: "BANDWIDTH", duration: 3 }),
    );

    expect(liveTx.familySpecificData).toEqual({ resource: "BANDWIDTH", duration: 3 });
    expect(liveTx).not.toHaveProperty("duration");
  });

  it("fills the vote name the wallet API does not carry, since coin-tron's Vote declares it", () => {
    const { liveTx } = signFlowInfos(
      walletApiTx({
        mode: "vote",
        votes: [{ address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH", voteCount: 7 }],
      }),
    );

    expect(liveTx.familySpecificData).toEqual({
      votes: [{ address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH", voteCount: 7, name: null }],
    });
    expect(liveTx).not.toHaveProperty("votes");
  });

  it("omits an empty vote list rather than sending one, so a claim keeps the seeded defaults", () => {
    const { liveTx } = signFlowInfos(walletApiTx({ mode: "claimReward" }));

    expect(liveTx).not.toHaveProperty("familySpecificData");
  });
});
