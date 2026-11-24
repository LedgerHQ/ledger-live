import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { isValidAccountBalances } from "@ledgerhq/ledger-wallet-framework/account/balances";
import type { AleoAccount, AleoTokenAccount } from "../types";
import { aleoAccountBalances } from "./accountBalances";

const bn = (n: number) => new BigNumber(n);

const pendingOp = (
  type: Operation["type"],
  value: number,
  fee: number,
  transactionType?: "public" | "private",
  stakedAmount?: number,
): Operation =>
  ({
    type,
    value: bn(value),
    fee: bn(fee),
    extra: {
      ...(transactionType && { transactionType }),
      ...(stakedAmount !== undefined && { stakedAmount: bn(stakedAmount) }),
    },
  }) as unknown as Operation;

const tokenAccount = (overrides: Partial<AleoTokenAccount> = {}): AleoTokenAccount =>
  ({
    type: "TokenAccount",
    id: "token-1",
    balance: bn(150),
    spendableBalance: bn(150),
    transparentBalance: bn(100),
    privateBalance: bn(50),
    pendingOperations: [],
    ...overrides,
  }) as unknown as AleoTokenAccount;

const account = ({
  transparent = 1000,
  privateBalance = 200 as number | null,
  bonded = 0,
  unbonding = 0,
  pendingOperations = [] as Operation[],
  subAccounts = [] as AleoTokenAccount[],
} = {}): AleoAccount => {
  const liquid = transparent + (privateBalance ?? 0);
  return {
    type: "Account",
    id: "aleo-account",
    balance: bn(liquid + bonded + unbonding),
    spendableBalance: bn(liquid),
    pendingOperations,
    subAccounts,
    aleoResources: {
      transparentBalance: bn(transparent),
      privateBalance: privateBalance === null ? null : bn(privateBalance),
      bondedBalance: bn(bonded),
      unbondingBalance: bn(unbonding),
    },
  } as unknown as AleoAccount;
};

const rowsOf = (acc: AleoAccount) => {
  const rows = aleoAccountBalances(acc).account;
  if (!rows) throw new Error("expected account rows");
  return rows;
};

describe("aleoAccountBalances", () => {
  describe("main account", () => {
    it("holds the bonded and unbonding funds in the public row, as value and as locked", () => {
      const acc = account({ bonded: 300, unbonding: 100 });

      const [publicRow, privateRow] = rowsOf(acc);

      expect(publicRow).toEqual({ value: bn(1400), locked: bn(400) });
      expect(privateRow).toEqual({ value: bn(200), locked: bn(0), private: true });
      expect(isValidAccountBalances(acc.balance, [publicRow, privateRow])).toBe(true);
    });

    it("leaves value minus locked equal to the spendable balance without pending operations", () => {
      const acc = account({ bonded: 300, unbonding: 100 });

      const spendable = rowsOf(acc).reduce(
        (sum, row) => sum.plus(row.value.minus(row.locked ?? 0)),
        bn(0),
      );

      expect(spendable).toEqual(acc.spendableBalance);
    });

    it("locks a pending private spend on the private row", () => {
      const [publicRow, privateRow] = rowsOf(
        account({ pendingOperations: [pendingOp("OUT", 30, 2, "private")] }),
      );

      expect(privateRow.locked).toEqual(bn(32));
      expect(publicRow.locked).toEqual(bn(0));
    });

    it("locks a pending public spend on the public row", () => {
      const [publicRow, privateRow] = rowsOf(
        account({ pendingOperations: [pendingOp("OUT", 30, 2, "public")] }),
      );

      expect(publicRow.locked).toEqual(bn(32));
      expect(privateRow.locked).toEqual(bn(0));
    });

    it("counts an operation without a transaction type on the public row", () => {
      const [publicRow, privateRow] = rowsOf(
        account({ pendingOperations: [pendingOp("OUT", 10, 1)] }),
      );

      expect(publicRow.locked).toEqual(bn(11));
      expect(privateRow.locked).toEqual(bn(0));
    });

    it("locks a pending bond like a spend and the fee alone for other staking operations", () => {
      const [publicRow] = rowsOf(
        account({
          pendingOperations: [
            // as built by buildOptimisticOperation: a bond's value is its fee
            pendingOp("BOND", 1, 1, "public", 100),
            pendingOp("UNBOND", 500, 3, "public"),
          ],
        }),
      );

      expect(publicRow.locked).toEqual(bn(104));
    });

    it("ignores incoming pending operations", () => {
      const [publicRow] = rowsOf(
        account({ pendingOperations: [pendingOp("IN", 500, 0, "public")] }),
      );

      expect(publicRow.locked).toEqual(bn(0));
    });

    it("clamps locked to the value of the row", () => {
      const [, privateRow] = rowsOf(
        account({ pendingOperations: [pendingOp("OUT", 99999, 1, "private")] }),
      );

      expect(privateRow.locked).toEqual(privateRow.value);
    });

    it("treats a missing private balance as zero", () => {
      const [, privateRow] = rowsOf(account({ privateBalance: null }));

      expect(privateRow).toEqual({ value: bn(0), locked: bn(0), private: true });
    });

    it("produces no account rows without Aleo resources, so the default row applies", () => {
      const { aleoResources: _omitted, ...acc }: AleoAccount = account();

      expect(aleoAccountBalances(acc).account).toBeUndefined();
    });
  });

  describe("token accounts", () => {
    it("emits a public and a private row that add up to the token balance", () => {
      const token = tokenAccount();

      const { tokens } = aleoAccountBalances(account({ subAccounts: [token] }));

      expect(tokens?.["token-1"]).toEqual([
        { value: bn(100), locked: bn(0) },
        { value: bn(50), locked: bn(0), private: true },
      ]);
      expect(isValidAccountBalances(token.balance, tokens?.["token-1"] ?? [])).toBe(true);
    });

    it("locks a pending token spend on the row it spends from, without the native fee", () => {
      const token = tokenAccount({
        pendingOperations: [pendingOp("OUT", 20, 5, "private"), pendingOp("OUT", 7, 5, "public")],
      });

      const { tokens } = aleoAccountBalances(account({ subAccounts: [token] }));

      expect(tokens?.["token-1"][0].locked).toEqual(bn(7));
      expect(tokens?.["token-1"][1].locked).toEqual(bn(20));
    });

    it("treats a missing private token balance as zero", () => {
      const token = tokenAccount({ privateBalance: null, balance: bn(100) });

      const { tokens } = aleoAccountBalances(account({ subAccounts: [token] }));

      expect(tokens?.["token-1"][1]).toEqual({ value: bn(0), locked: bn(0), private: true });
    });
  });
});
