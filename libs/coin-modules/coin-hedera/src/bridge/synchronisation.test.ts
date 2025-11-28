import type { Account } from "@ledgerhq/types-live";
import { postSync } from "./synchronisation";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import { getMockedOperation } from "../test/fixtures/operation.fixture";
import { getMockedHTSTokenCurrency } from "../test/fixtures/currency.fixture";

describe("postSync", () => {
  it("should remove pending operations that match confirmed ERC20 operations", () => {
    const confirmedERC20Ops = [
      getMockedOperation({ hash: "hash1", standard: "erc20" }),
      getMockedOperation({ hash: "hash2", standard: "erc20" }),
    ];

    const initialAccount = {} as Account;
    const syncedAccount = getMockedAccount({
      operations: [...confirmedERC20Ops, getMockedOperation({ hash: "otherHash" })],
      pendingOperations: [
        getMockedOperation({ hash: "hash1" }),
        getMockedOperation({ hash: "hash2" }),
        getMockedOperation({ hash: "hash3" }),
      ],
    });

    const result = postSync(initialAccount, syncedAccount);

    expect(result.pendingOperations).toHaveLength(1);
    expect(result.pendingOperations).toMatchObject([{ hash: "hash3" }]);
  });

  it("should filter pending operations from subaccounts", () => {
    const mockToken1 = getMockedHTSTokenCurrency();

    const confirmedERC20Ops = [
      getMockedOperation({ hash: "hash1", standard: "erc20" }),
      getMockedOperation({ hash: "hash2", standard: "erc20" }),
    ];

    const subAccounts = [
      getMockedTokenAccount(mockToken1, {
        pendingOperations: [
          getMockedOperation({ hash: "hash1" }),
          getMockedOperation({ hash: "hash4" }),
        ],
      }),
      getMockedTokenAccount(mockToken1, {
        pendingOperations: [
          getMockedOperation({ hash: "hash2" }),
          getMockedOperation({ hash: "hash5" }),
        ],
      }),
    ];

    const initialAccount = {} as Account;
    const syncedAccount = getMockedAccount({
      operations: [...confirmedERC20Ops, getMockedOperation({ hash: "otherHash" })],
      subAccounts,
    });

    const result = postSync(initialAccount, syncedAccount);

    expect(result.subAccounts).toHaveLength(2);
    expect(result.subAccounts).toMatchObject([
      { pendingOperations: [{ hash: "hash4" }] },
      { pendingOperations: [{ hash: "hash5" }] },
    ]);
  });
});
