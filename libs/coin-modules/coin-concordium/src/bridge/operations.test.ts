import BigNumber from "bignumber.js";
import { getOperationAmountNumber } from "@ledgerhq/ledger-wallet-framework/operation";
import { parseTransaction } from "../logic/history/listOperations";
import {
  VALID_ADDRESS,
  VALID_ADDRESS_2,
  createFixtureContext,
  createFixtureOperation,
  createFixtureTokenAccount,
} from "../test/fixtures";
import type { WalletProxyTransaction } from "../types";
import { attachSubOperations, splitPaidFee, toOperation } from "./operations";

const context = createFixtureContext();

type AccountView = Pick<
  WalletProxyTransaction,
  "origin" | "cost" | "sponsor" | "subtotal" | "total" | "details"
>;

const success = (type: string) => ({ type, outcome: "success" }) as const;

describe("the operations of a native row", () => {
  const row = {
    id: 42,
    blockTime: 1763000000,
    blockHeight: 1000,
    transactionHash: "ab".repeat(32),
    transactionCost: "4000",
  };
  const sent = { origin: { type: "self" }, cost: "4000" } as const;
  const received = { origin: { type: "account", address: VALID_ADDRESS_2 } } as const;
  const sponsored = {
    ...received,
    cost: "4000",
    sponsor: { sponsor: VALID_ADDRESS, cost: "4000" },
  } as const;
  const transfer = {
    ...success("transfer"),
    transferSource: VALID_ADDRESS_2,
    transferDestination: VALID_ADDRESS,
    transferAmount: "1000",
  };

  it.each<[string, AccountView]>([
    ["registered data", { ...sent, total: "-4000", details: success("registerData") }],
    [
      "a rejected call",
      { ...sent, total: "-4000", details: { type: "update", outcome: "reject" } },
    ],
    ["a deposit", { ...sent, subtotal: "-70", total: "-4070", details: success("update") }],
    ["a refund", { ...sent, subtotal: "70", total: "-3930", details: success("update") }],
    [
      "a shielded amount",
      { ...sent, subtotal: "-70", total: "-4070", details: success("transferToEncrypted") },
    ],
    [
      "an unshielded amount",
      { ...sent, subtotal: "70", total: "-3930", details: success("transferToPublic") },
    ],
    ["a payout", { ...received, total: "70", details: success("update") }],
    ["a sponsored call", { ...sponsored, total: "-4000", details: success("update") }],
    [
      "a transfer it sponsored and received",
      { ...sponsored, subtotal: "1000", total: "-3000", details: transfer },
    ],
  ])("add up to the proxy's total, for %s", (_kind, view) => {
    const operation = parseTransaction(context, { ...row, ...view }, VALID_ADDRESS);
    const operations = splitPaidFee(operation!).map(op => toOperation(op, "account-id"));

    expect(
      operations.reduce((sum, op) => sum.plus(getOperationAmountNumber(op)), new BigNumber(0)),
    ).toEqual(new BigNumber(view.total));
  });
});

describe("attachSubOperations", () => {
  it("reads each sub-account once, however many fees the history holds", () => {
    const subAccount = createFixtureTokenAccount();
    const readOperations = jest.fn(() => []);
    Object.defineProperty(subAccount, "operations", { get: readOperations });
    const fees = Array.from({ length: 100 }, (_, index) =>
      createFixtureOperation({ id: `fee-${index}`, hash: `hash-${index}`, type: "FEES" }),
    );

    attachSubOperations(fees, [subAccount]);

    expect(readOperations).toHaveBeenCalledTimes(1);
  });
});
