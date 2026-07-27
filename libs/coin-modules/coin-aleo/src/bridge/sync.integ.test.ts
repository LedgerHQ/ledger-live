import BigNumber from "bignumber.js";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { SYNC_TYPE_TRANSPARENT } from "@ledgerhq/types-live";
import type { SyncConfig } from "@ledgerhq/types-live";
import aleoConfig from "../config";
import { getTestnetIntegConfig } from "../__tests__/fixtures/config.fixture";
import { testnetAddress, testnetViewKey } from "../__tests__/fixtures/api.fixture";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { setupCalStore } from "../__tests__/helpers/cal";
import { getPristineAccount } from "../__tests__/helpers/account";
import { AleoApiConfigurationResetError } from "../errors";
import { performPublicSync, performPrivateSync } from "./sync";
import type { AleoAccount, AleoResources } from "../types";

const currency = getCryptoCurrencyById("aleo_testnet");
const syncConfig: SyncConfig = { paginationConfig: {}, syncType: SYNC_TYPE_TRANSPARENT };

// performPrivateSync reads the view key back out of the account id, so it has to be encoded in
const ledgerAccountId = encodeAccountId({
  type: "js",
  version: "2",
  currencyId: currency.id,
  xpubOrAddress: testnetAddress,
  derivationMode: "",
  customData: testnetViewKey,
});

function makeShapeInfo(address: string, initialAccount?: AleoAccount) {
  return {
    currency,
    address,
    index: 0,
    derivationPath: "",
    derivationMode: "" as const,
    ...(initialAccount && { initialAccount }),
  };
}

// null provableApi forces a fresh scanner registration; accessProvableApi is idempotent per view key
function makePrivateSyncArgs(provableApi: AleoResources["provableApi"] = null) {
  const initialAccount = getMockedAccount({
    id: ledgerAccountId,
    freshAddress: testnetAddress,
    currency,
    aleoResources: {
      transparentBalance: new BigNumber(0),
      provableApi,
      privateBalance: null,
      unspentPrivateRecords: null,
      lastPrivateSyncDate: null,
    },
  });

  return {
    info: makeShapeInfo(testnetAddress, initialAccount),
    syncConfig,
    currentPublicOps: [],
  };
}

beforeAll(() => {
  aleoConfig.setCoinConfig(() => getTestnetIntegConfig());
  setupCalStore();
});

describe("performPublicSync — fresh sync of active account", () => {
  let result: Partial<AleoAccount>;

  beforeAll(async () => {
    result = await performPublicSync(makeShapeInfo(testnetAddress), syncConfig);
  });

  it("returns positive balance and block height", () => {
    expect(result.balance?.toNumber()).toBeGreaterThan(0);
    expect(result.spendableBalance?.toNumber()).toBeGreaterThan(0);
    expect(result.blockHeight).toBeGreaterThan(0);
  });

  it("returns operations sorted newest first", () => {
    const ops = result.operations ?? [];

    expect(ops.length).toBeGreaterThan(0);
    for (let i = 0; i < ops.length - 1; i++) {
      expect(ops[i].date.getTime()).toBeGreaterThanOrEqual(ops[i + 1].date.getTime());
    }
  });

  it("returns operations with correct shape", () => {
    expect(result.operations?.length).toBeGreaterThan(0);
    const op = result.operations![0];

    expect(op.id.length).toBeGreaterThan(0);
    expect(op.hash.length).toBeGreaterThan(0);
    expect(op.blockHeight).toBeGreaterThan(0);
    expect(op.date).toBeInstanceOf(Date);
    expect(op.value.toNumber()).toBeGreaterThanOrEqual(0);
  });

  it("populates aleoResources with transparent balance and null private balance", () => {
    expect(result.aleoResources?.transparentBalance?.toNumber()).toBeGreaterThan(0);
    expect(result.aleoResources?.privateBalance).toBeNull();
    expect(result.lastSyncDate).toBeInstanceOf(Date);
  });
});

describe("performPublicSync — fresh sync of empty account", () => {
  let result: Partial<AleoAccount>;

  beforeAll(async () => {
    const pristineAccount = await getPristineAccount();
    result = await performPublicSync(makeShapeInfo(pristineAccount.address), syncConfig);
  });

  it("returns zero balance and empty operations list", () => {
    expect(result.balance?.toNumber()).toBe(0);
    expect(result.operations).toEqual([]);
    expect(result.operationsCount).toBe(0);
  });

  it("still returns a valid block height", () => {
    expect(result.blockHeight).toBeGreaterThan(0);
  });
});

describe("performPrivateSync — account with private history", () => {
  let result: Partial<AleoAccount> | null;
  const progress: number[] = [];

  beforeAll(async () => {
    result = await performPrivateSync({
      ...makePrivateSyncArgs(),
      onProgress: pct => progress.push(pct),
    });
  });

  // performPrivateSync resolves to null while the record scanner is still catching up, which it
  // is for a while after any new transaction on this account. Asserted on its own so that case
  // fails once, clearly, instead of surfacing as four confusing undefined mismatches below.
  it("completes instead of bailing out on a scanner that is still catching up", () => {
    expect(result).not.toBeNull();
  });

  // deliberately not asserting a fixed amount: this reads the account's live records, so any
  // private transaction the team makes would change it. The sum invariant holds regardless.
  it("returns a private balance equal to the sum of its unspent records", () => {
    const records = result?.aleoResources?.unspentPrivateRecords ?? [];
    const total = records.reduce((acc, r) => acc.plus(r.microcredits), new BigNumber(0));

    expect(records.length).toBeGreaterThan(0);
    expect(result?.aleoResources?.privateBalance).toEqual(total);
  });

  it("returns a scanner uuid and a private sync date", () => {
    expect(result?.aleoResources?.provableApi?.uuid).toEqual(expect.any(String));
    expect(result?.aleoResources?.lastPrivateSyncDate).toBeInstanceOf(Date);
  });

  it("totals balance as transparent + private", () => {
    const transparent = result?.aleoResources?.transparentBalance ?? new BigNumber(0);
    const priv = result?.aleoResources?.privateBalance ?? new BigNumber(0);

    expect(result?.balance).toEqual(transparent.plus(priv));
    expect(result?.spendableBalance).toEqual(result?.balance);
  });

  it("returns private operations sorted newest first", () => {
    const ops = result?.operations ?? [];

    expect(ops).toEqual(
      expect.arrayContaining([expect.objectContaining({ accountId: ledgerAccountId })]),
    );

    for (let i = 0; i < ops.length - 1; i++) {
      expect(ops[i].date.getTime()).toBeGreaterThanOrEqual(ops[i + 1].date.getTime());
    }
  });

  it("reports monotonic progress ending at 100", () => {
    expect(progress.at(-1)).toBe(100);
    expect([...progress].sort((a, b) => a - b)).toEqual(progress);
  });
});

describe("performPrivateSync — failure paths", () => {
  it("throws AleoApiConfigurationResetError for an unknown stored scanner uuid", async () => {
    await expect(
      performPrivateSync(makePrivateSyncArgs({ uuid: "00000000-0000-0000-0000-000000000000" })),
    ).rejects.toBeInstanceOf(AleoApiConfigurationResetError);
  });

  it("aborts when the signal is already aborted", async () => {
    await expect(
      performPrivateSync({ ...makePrivateSyncArgs(), signal: AbortSignal.abort() }),
    ).rejects.toThrow(/abort/i);
  });
});
