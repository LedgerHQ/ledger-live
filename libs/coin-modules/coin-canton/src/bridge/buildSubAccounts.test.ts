import {
  TokenCurrency,
  TokenCurrencyIdSchema,
  CryptoCurrencyIdSchema,
} from "@ledgerhq/ledger-wallet-framework/types";
import { createEmptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  generateHistoryFromOperations,
  recalculateAccountBalanceHistories,
} from "@ledgerhq/ledger-wallet-framework/account/balanceHistoryCache";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { TransferProposal } from "../network/gateway";
import { buildSubAccounts, CantonTokenAccount } from "./buildSubAccounts";

const makeTokenCurrency = (overrides: Partial<TokenCurrency> = {}): TokenCurrency => {
  return {
    type: "TokenCurrency",
    id: overrides.id ?? TokenCurrencyIdSchema.parse("canton_network/cip56/TOKEN_A"),
    contractAddress: overrides.contractAddress ?? "admin-TOKEN_A",
    parentCurrencyId: overrides.parentCurrencyId ?? CryptoCurrencyIdSchema.parse("canton_network"),
    tokenType: "canton",
    name: overrides.name ?? "Token A",
    ticker: overrides.ticker ?? "TOKA",
    units: overrides.units ?? [
      {
        name: overrides.name ?? "Token A",
        code: overrides.ticker ?? "TOKA",
        magnitude: 18,
      },
    ],
    disableCountervalue: overrides.disableCountervalue ?? true,
  };
};

const makeOperation = (overrides: Partial<Operation> = {}): Operation => {
  return {
    id: overrides.id ?? "op1",
    hash: overrides.hash ?? "hash1",
    accountId: overrides.accountId ?? "acc1",
    type: overrides.type ?? "OUT",
    value: overrides.value ?? new BigNumber(100),
    fee: overrides.fee ?? new BigNumber(0),
    blockHash: overrides.blockHash ?? "block-hash",
    blockHeight: overrides.blockHeight ?? 1,
    senders: overrides.senders ?? [],
    recipients: overrides.recipients ?? [],
    date: overrides.date ?? new Date(),
    extra: overrides.extra ?? {},
  } as Operation;
};

const makeProposal = (overrides: Partial<TransferProposal> = {}): TransferProposal => {
  return {
    contract_id: overrides.contract_id ?? "proposal-1",
    instrument_id: overrides.instrument_id ?? "TOKEN_A",
    instrument_admin: overrides.instrument_admin ?? "admin-TOKEN_A",
    amount: overrides.amount ?? "100",
    sender: overrides.sender ?? "sender",
    receiver: overrides.receiver ?? "receiver",
    memo: overrides.memo ?? "",
    expires_at_micros: overrides.expires_at_micros ?? 1_800_000_000_000_000,
    update_id: overrides.update_id ?? "test-update-id",
  };
};

const parentOf = (subAccounts: TokenAccount[]) =>
  ({ balanceHistoryCache: createEmptyHistoryCache(), subAccounts }) as unknown as Account;

describe("buildSubAccounts", () => {
  const accountId = "js:2:canton_network:party123:";

  it("creates a token sub-account with balances and operations", () => {
    const token = makeTokenCurrency();

    const tokenBalances = [
      {
        adminId: "admin-TOKEN_A",
        totalBalance: BigInt(700),
        spendableBalance: BigInt(500),
        token,
      },
    ];

    const operations: Operation[] = [
      makeOperation({
        hash: "native-op",
        extra: { instrumentId: "Amulet", instrumentAdmin: "native-admin" },
      }),
      makeOperation({
        hash: "token-op",
        extra: { instrumentId: "TOKEN_A", instrumentAdmin: "admin-TOKEN_A" },
      }),
    ];

    const proposals: TransferProposal[] = [
      makeProposal({
        contract_id: "native-proposal",
        instrument_id: "Amulet",
        instrument_admin: "native-admin",
      }),
      makeProposal({
        contract_id: "token-proposal",
        instrument_id: "TOKEN_A",
        instrument_admin: "admin-TOKEN_A",
      }),
    ];

    const calTokens = new Map<string, string>([[token.id, "TOKEN_A"]]);

    const subAccounts = buildSubAccounts({
      accountId,
      tokenBalances,
      existingSubAccounts: [],
      allOperations: operations,
      pendingTransferProposals: proposals,
      calTokens,
    });

    expect(subAccounts).toHaveLength(1);
    const sub = subAccounts[0] as CantonTokenAccount;

    expect(sub.type).toBe("TokenAccount");
    expect(sub.balance).toEqual(new BigNumber(700));
    expect(sub.spendableBalance).toEqual(new BigNumber(500));

    expect(sub.operations).toHaveLength(1);
    expect(sub.operations[0].hash).toBe("token-op");

    expect(sub.cantonResources.pendingTransferProposals).toHaveLength(1);
    expect(sub.cantonResources.pendingTransferProposals[0].contract_id).toBe("token-proposal");
  });

  describe("with saved sub-accounts", () => {
    const token = makeTokenCurrency();
    const calTokens = new Map([[token.id, "TOKEN_A"]]);
    const savedUnder = (
      adminId: string,
      hash: string,
      balance: bigint,
      savedToken = token,
    ): CantonTokenAccount => {
      const [saved] = buildSubAccounts({
        accountId,
        tokenBalances: [
          { adminId, totalBalance: balance, spendableBalance: balance, token: savedToken },
        ],
        existingSubAccounts: [],
        allOperations: [
          makeOperation({
            hash,
            date: new Date("2026-01-01T00:00:00Z"),
            extra: { instrumentId: "TOKEN_A", instrumentAdmin: adminId },
          }),
        ],
        pendingTransferProposals: [],
        calTokens: new Map([[savedToken.id, "TOKEN_A"]]),
      });
      return { ...saved, balanceHistoryCache: generateHistoryFromOperations(saved) };
    };
    const rebuild = (existingSubAccounts: TokenAccount[]) =>
      buildSubAccounts({
        accountId,
        tokenBalances: [
          { adminId: "admin-TOKEN_A", totalBalance: 500n, spendableBalance: 500n, token },
        ],
        existingSubAccounts,
        allOperations: [],
        pendingTransferProposals: [],
        calTokens,
      });

    const savedOwn = savedUnder("admin-TOKEN_A", "own-old-op", 1n);
    const savedForeign = savedUnder("impostor-admin", "foreign-op", 900n);

    it.each([
      { order: "own first", saved: [savedOwn, savedForeign] },
      { order: "foreign first", saved: [savedForeign, savedOwn] },
    ])(
      "keeps only the CAL admin's saved history and regenerates its chart, $order",
      ({ saved }) => {
        const [sub] = rebuild(saved);

        expect(sub.operations.map(op => op.hash)).toEqual(["own-old-op"]);
        expect(sub.balanceHistoryCache).toBe(saved[0].balanceHistoryCache);
        const [recalculated] =
          recalculateAccountBalanceHistories(parentOf([sub]), parentOf(saved)).subAccounts ?? [];
        expect(recalculated.balanceHistoryCache.HOUR.balances.at(-1)).toBe(500);
      },
    );

    it("keeps each same-ticker token's own pending operations and chart", () => {
      const tokenB = makeTokenCurrency({
        id: TokenCurrencyIdSchema.parse("canton_network/cip56/TOKEN_A_B"),
        contractAddress: "admin-B",
      });
      const savedA = {
        ...savedUnder("admin-TOKEN_A", "a-op", 1n),
        pendingOperations: [makeOperation({ hash: "a-pending" })],
      };
      const savedB = {
        ...savedUnder("admin-B", "b-op", 900n, tokenB),
        pendingOperations: [makeOperation({ hash: "b-pending" })],
      };

      const [subA, subB] = buildSubAccounts({
        accountId,
        tokenBalances: [
          { adminId: "admin-TOKEN_A", totalBalance: 1n, spendableBalance: 1n, token },
          { adminId: "admin-B", totalBalance: 900n, spendableBalance: 900n, token: tokenB },
        ],
        existingSubAccounts: [savedA, savedB],
        allOperations: [],
        pendingTransferProposals: [],
        calTokens: new Map([
          [token.id, "TOKEN_A"],
          [tokenB.id, "TOKEN_A"],
        ]),
      });

      expect(subA.operations.map(op => op.hash)).toEqual(["a-op"]);
      expect(subA.pendingOperations.map(op => op.hash)).toEqual(["a-pending"]);
      expect(subA.balanceHistoryCache).toBe(savedA.balanceHistoryCache);
      expect(subB.operations.map(op => op.hash)).toEqual(["b-op"]);
      expect(subB.pendingOperations.map(op => op.hash)).toEqual(["b-pending"]);
      expect(subB.balanceHistoryCache).toBe(savedB.balanceHistoryCache);
    });

    it("moves history saved under a former token id into the current sub-account, once", () => {
      const formerToken = makeTokenCurrency({
        id: TokenCurrencyIdSchema.parse("canton_network/cip56/former_token_a"),
      });

      const [sub] = rebuild([
        savedUnder("admin-TOKEN_A", "old-op", 1n, formerToken),
        savedUnder("admin-TOKEN_A", "old-op", 1n),
      ]);

      expect(sub.operations).toEqual([
        expect.objectContaining({
          hash: "old-op",
          id: encodeOperationId(sub.id, "old-op", "OUT"),
          accountId: sub.id,
        }),
      ]);
    });
  });
});
