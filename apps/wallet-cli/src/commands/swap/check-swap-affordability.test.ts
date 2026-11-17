import "../../live-common-setup";
import { describe, expect, it } from "bun:test";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { NotEnoughBalance, NotEnoughGas } from "@ledgerhq/ledger-wallet-framework/errors";
import type { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Account } from "@ledgerhq/types-live";
import { checkSwapAffordability } from "./check-swap-affordability";

// The EVM bridge never throws while preparing nor reports a dust limit, so `swap execute`'s CLI
// tests can't reach these cases.

const account = {
  type: "Account",
  currency: getCryptoCurrencyById("ethereum"),
  freshAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  spendableBalance: new BigNumber(0),
} as Account;

/** A bridge that throws `prepareError` while preparing, or else reports `errors`. */
function bridge({ prepareError, errors = {} }: { prepareError?: Error; errors?: object }) {
  return (async () => ({
    createTransaction: () => ({}),
    updateTransaction: (transaction: object, patch: object) => ({ ...transaction, ...patch }),
    prepareTransaction: async (_account: Account, transaction: object) => {
      if (prepareError) throw prepareError;
      return transaction;
    },
    getTransactionStatus: async () => ({ errors, estimatedFees: new BigNumber(0) }),
  })) as unknown as typeof getAccountBridge;
}

function check(getBridge: typeof getAccountBridge) {
  return checkSwapAffordability({
    account,
    parentAccount: undefined,
    amount: new BigNumber("1000000000000000000"),
    feeStrategy: "MEDIUM",
    getAccountBridge: getBridge,
  });
}

describe("checkSwapAffordability", () => {
  it("rewords a shortfall thrown while preparing, keeping the bridge error's class and fields", async () => {
    const bridgeError = new NotEnoughBalance(undefined, { minimum: "1" });

    const error = await check(bridge({ prepareError: bridgeError })).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotEnoughBalance);
    expect(error).toMatchObject({
      minimum: "1",
      cause: bridgeError,
      message:
        "Insufficient balance: swapping 1 ETH plus network fees exceeds the spendable 0 ETH.",
    });
    expect(bridgeError.message).toBe("NotEnoughBalance");
  });

  it("rewords a fee shortfall thrown while preparing", () =>
    expect(check(bridge({ prepareError: new NotEnoughGas() }))).rejects.toThrow(
      "Not enough ETH to pay the network fees for this swap.",
    ));

  it("leaves the check inconclusive when preparing fails otherwise", () =>
    expect(
      check(bridge({ prepareError: new Error("gas estimation RPC unavailable") })),
    ).resolves.toEqual({
      checked: false,
      reason: "gas estimation RPC unavailable",
    }));

  it("keeps the bridge message of a blocking error it doesn't reword", () => {
    const dust = Object.assign(new Error("Amount is below the dust limit"), { name: "DustLimit" });

    return expect(check(bridge({ errors: { amount: dust } }))).rejects.toBe(dust);
  });
});
