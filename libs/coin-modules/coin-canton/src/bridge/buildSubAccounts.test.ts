import BigNumber from "bignumber.js";
import type { Operation, TokenAccount } from "@ledgerhq/types-live";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { buildSubAccounts, CantonTokenAccount } from "./buildSubAccounts";
import type { TransferProposal } from "../network/gateway";

const makeTokenCurrency = (overrides: Partial<TokenCurrency> = {}): TokenCurrency => {
  return {
    type: "TokenCurrency",
    id: overrides.id ?? "canton_network/cip56/TOKEN_A",
    contractAddress: overrides.contractAddress ?? "admin-TOKEN_A",
    parentCurrency: overrides.parentCurrency as any,
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
    expires_at_micros: overrides.expires_at_micros ?? Date.now() + 1000,
  };
};

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
});
