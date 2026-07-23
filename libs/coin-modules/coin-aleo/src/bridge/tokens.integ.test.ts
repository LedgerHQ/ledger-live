import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import aleoConfig from "../config";
import { getTestnetIntegConfig } from "../__tests__/fixtures/config.fixture";
import {
  TEST_TOKEN_PROGRAM_ID,
  testnetAddress,
  testnetIncomingPrivateRecord1,
  testnetLedgerAccountId,
  testnetOutgoingPrivateTokenRecord,
  testnetViewKey,
} from "../__tests__/fixtures/api.fixture";
import { setupCalStore } from "../__tests__/helpers/cal";
import { listOperations } from "../logic/listOperations";
import { getCalTokens } from "../logic/utils";
import { buildSubAccountsFromPrivateRecords, resolveTokenSubAccounts } from "./tokens";
import type { AleoOperation } from "../types";

const currency = getCryptoCurrencyById("aleo_testnet");
const config = { ...getTestnetIntegConfig(), enableTokens: true };
const TEST_USAD_TOKEN_ID = "aleo_testnet/arc22/test_usad";

let calTokens: Map<string, TokenCurrency>;

beforeAll(async () => {
  setupCalStore();
  aleoConfig.setCoinConfig(() => config);
  calTokens = await getCalTokens({
    currencyId: currency.id,
    programNames: [TEST_TOKEN_PROGRAM_ID],
  });
});

describe("resolveTokenSubAccounts", () => {
  let listOperationsResult: {
    operations: AleoOperation[];
    tokenOperations: AleoOperation[];
    calTokens: Map<string, TokenCurrency>;
  };

  beforeAll(async () => {
    listOperationsResult = await listOperations({
      config,
      currencyId: currency.id,
      address: testnetAddress,
      ledgerAccountId: testnetLedgerAccountId,
      mode: "bridge",
      options: { minHeight: 0, limit: 50, order: "asc" },
    });
  });

  const resolve = (enableTokens: boolean) =>
    resolveTokenSubAccounts({
      enableTokens,
      config,
      address: testnetAddress,
      ledgerAccountId: testnetLedgerAccountId,
      publicOperations: listOperationsResult.operations,
      tokenOperations: listOperationsResult.tokenOperations,
      calTokens: listOperationsResult.calTokens,
      shouldSyncFromScratch: true,
      initialAccount: undefined,
    });

  it("builds a token sub-account carrying its public balance and operations", async () => {
    const { subAccounts } = await resolve(true);

    expect(subAccounts).toEqual([
      expect.objectContaining({
        token: expect.objectContaining({ id: TEST_USAD_TOKEN_ID }),
        operations: expect.arrayContaining([
          expect.objectContaining({
            extra: expect.objectContaining({ programId: TEST_TOKEN_PROGRAM_ID }),
          }),
        ]),
      }),
    ]);
    // live on-chain token balance, so only its presence and sign are stable
    expect(subAccounts[0].balance.isGreaterThanOrEqualTo(0)).toBe(true);
  });

  it("drops token sub-accounts and token-bearing operations when tokens are disabled", async () => {
    const { subAccounts, updatedCoinOperations } = await resolve(false);

    expect(subAccounts).toEqual([]);
    expect(updatedCoinOperations.every(op => (op.subOperations ?? []).length === 0)).toBe(true);
  });
});

describe("buildSubAccountsFromPrivateRecords", () => {
  const build = (calTokensOverride?: Map<string, TokenCurrency>) =>
    buildSubAccountsFromPrivateRecords({
      config,
      ledgerAccountId: testnetLedgerAccountId,
      allPrivateRecords: [testnetIncomingPrivateRecord1, testnetOutgoingPrivateTokenRecord],
      unspentPrivateRecords: [testnetOutgoingPrivateTokenRecord],
      baseSubAccounts: [],
      viewKey: testnetViewKey,
      address: testnetAddress,
      calTokens: calTokensOverride ?? calTokens,
    });

  it("decrypts private token records into a sub-account with its private balance", async () => {
    const { subAccounts } = await build();

    expect(subAccounts).toEqual([
      expect.objectContaining({
        token: expect.objectContaining({ id: TEST_USAD_TOKEN_ID }),
        // the sole unspent record is the 0-value change left by a fully drained transfer
        balance: new BigNumber(0),
      }),
    ]);
  });

  it("derives IN and OUT operations from the record history, newest first", async () => {
    const { subAccounts, privateTokenOpsByAccountId } = await build();

    expect(privateTokenOpsByAccountId.get(subAccounts[0].id)).toEqual([
      expect.objectContaining({ type: "OUT", value: new BigNumber(1) }),
      expect.objectContaining({ type: "IN", value: new BigNumber(1) }),
    ]);
  });

  it("ignores records whose program is not a known CAL token", async () => {
    const { subAccounts, privateTokenOpsByAccountId } = await build(new Map());

    expect(subAccounts).toEqual([]);
    expect(privateTokenOpsByAccountId.size).toBe(0);
  });
});
