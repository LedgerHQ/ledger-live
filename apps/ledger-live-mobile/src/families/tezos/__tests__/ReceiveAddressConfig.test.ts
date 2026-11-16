import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, OperationType } from "@ledgerhq/types-live";
import receiveAddressConfig from "../ReceiveAddressConfig";

const tezosAccount = (history: ReadonlyArray<[OperationType, string]>): Account => {
  const account = genAccount("tezos-receive", {
    currency: getCryptoCurrencyById("tezos"),
    operationsSize: 1,
  });
  const [template] = account.operations;
  const operations = history.map(([type, date]) => ({
    ...template,
    type,
    date: new Date(date),
    hasFailed: false,
  }));
  return { ...account, operations, pendingOperations: [] };
};

const tezosInput = (legacyAccount?: Account) =>
  mockReceiveFamilyConfigInput<Account>({
    descriptor: mockAddressAccountDescriptor({ network: "tezos", path: "m/44h/1729h/0h/0h" }),
    asset: { id: "tezos" },
    legacyAccount,
  });

describe("tezos ReceiveAddressConfig", () => {
  it("should show the delegation notice when nothing was received since the delegation", () => {
    const account = tezosAccount([["DELEGATE", "2026-01-01"]]);

    expect(receiveAddressConfig(tezosInput(account))).toEqual({ notices: ["tezosDelegation"] });
  });

  it("should not show a notice when funds were received since the delegation", () => {
    const account = tezosAccount([
      ["IN", "2026-02-01"],
      ["DELEGATE", "2026-01-01"],
    ]);

    expect(receiveAddressConfig(tezosInput(account))).toEqual({});
  });

  it("should not show a notice when the account does not delegate", () => {
    expect(receiveAddressConfig(tezosInput(tezosAccount([])))).toEqual({});
  });

  it("should not show a notice without the legacy account", () => {
    expect(receiveAddressConfig(tezosInput())).toEqual({});
  });
});
