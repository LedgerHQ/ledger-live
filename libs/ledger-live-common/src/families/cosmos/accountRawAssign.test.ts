import type { Account, AccountRaw } from "@ledgerhq/types-live";
import accountRawAssign from "./accountRawAssign";

describe("cosmos accountRawAssign", () => {
  it("serializes the sequence", () => {
    const accountRaw = {} as AccountRaw;

    accountRawAssign.assignToAccountRaw({ sequence: 3 } as unknown as Account, accountRaw);

    expect(accountRaw).toMatchObject({ sequence: 3 });
  });

  it("restores the sequence from a persisted account", () => {
    const account = {} as Account;

    accountRawAssign.assignFromAccountRaw({ sequence: 5 } as unknown as AccountRaw, account);

    expect(account).toMatchObject({ sequence: 5 });
  });

  it("exposes the operation extra serializers", () => {
    expect(accountRawAssign.fromOperationExtraRaw).toBeInstanceOf(Function);
    expect(accountRawAssign.toOperationExtraRaw).toBeInstanceOf(Function);
  });
});
