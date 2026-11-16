import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import type { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import { receiveAddressConfig } from "../receiveAddressConfig";
import { createMockAccount, createMockOperation } from "./testUtils";

const operation = (type: "DELEGATE" | "IN", date: Date) => ({
  ...createMockOperation(),
  type,
  date,
  recipients: ["tz1baker"],
  transactionSequenceNumber: undefined,
});

const tezosInput = (legacyAccount?: TezosAccount) =>
  mockReceiveFamilyConfigInput<TezosAccount>({
    descriptor: mockAddressAccountDescriptor({ network: "tezos", path: "m/44h/1729h/0h/0h" }),
    asset: { id: "tezos" },
    legacyAccount,
  });

describe("tezos receiveAddressConfig", () => {
  it("should show the delegation notice when nothing was received since the delegation", () => {
    const account = createMockAccount("tezos-delegated", {
      operations: [operation("DELEGATE", new Date("2026-01-01"))],
      pendingOperations: [],
    });

    expect(receiveAddressConfig(tezosInput(account))).toEqual({ notices: ["tezosDelegation"] });
  });

  it("should not show a notice when funds were received since the delegation", () => {
    const account = createMockAccount("tezos-received", {
      operations: [
        operation("IN", new Date("2026-02-01")),
        operation("DELEGATE", new Date("2026-01-01")),
      ],
      pendingOperations: [],
    });

    expect(receiveAddressConfig(tezosInput(account))).toEqual({});
  });

  it("should not show a notice when the account does not delegate", () => {
    const account = createMockAccount("tezos-idle", { operations: [], pendingOperations: [] });

    expect(receiveAddressConfig(tezosInput(account))).toEqual({});
  });

  it("should not show a notice without the legacy account", () => {
    expect(receiveAddressConfig(tezosInput())).toEqual({});
  });
});
