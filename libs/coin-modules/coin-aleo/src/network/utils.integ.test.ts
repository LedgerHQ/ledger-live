import invariant from "invariant";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import aleoConfig from "../config";
import { getTestnetIntegConfig } from "../__tests__/fixtures/config.fixture";
import {
  testnetAddress,
  testnetInboundPrivateToPublicTx,
  testnetLedgerAccountId,
  testnetMatchingPrivateRecord,
  testnetOutgoingPrivateToPublicRecord,
  testnetOutgoingPrivateTokenRecord,
  testnetSelfConversionTx,
  testnetThirdPartyConversionTx,
  testnetThirdPartyRealRecipient,
  testnetViewKey,
} from "../__tests__/fixtures/api.fixture";
import { getPristineAccount } from "../__tests__/helpers/account";
import { AleoApiConfigurationResetError } from "../errors";
import { toBridgeOperation } from "../logic/utils";
import type { AleoPrivateRecord, AleoPublicTransaction } from "../types";
import {
  accessProvableApi,
  fetchAllOwnedRecords,
  getTokenOutDetails,
  patchPublicOperations,
} from "./utils";

const currency = getCryptoCurrencyById("aleo_testnet");

beforeAll(() => {
  aleoConfig.setCoinConfig(() => getTestnetIntegConfig());
});

describe("accessProvableApi", () => {
  it("registers a new scanner account when no uuid is known and returns its status", async () => {
    const result = await accessProvableApi({
      currency,
      viewKey: testnetViewKey,
      provableApi: null,
    });

    expect(typeof result.uuid).toBe("string");
    expect(result.uuid?.length).toBeGreaterThan(0);
    expect(typeof result.scannerStatus?.synced).toBe("boolean");
    expect(typeof result.scannerStatus?.percentage).toBe("number");
  });

  it("registering the same view key twice returns the same scanner uuid", async () => {
    const first = await accessProvableApi({
      currency,
      viewKey: testnetViewKey,
      provableApi: null,
    });
    const second = await accessProvableApi({
      currency,
      viewKey: testnetViewKey,
      provableApi: null,
    });

    expect(second.uuid).toBe(first.uuid);
  });

  it("reuses a known uuid without re-registering and refreshes its scanner status", async () => {
    const { uuid } = await accessProvableApi({
      currency,
      viewKey: testnetViewKey,
      provableApi: null,
    });
    invariant(uuid, "guard: missing uuid");

    const result = await accessProvableApi({
      currency,
      viewKey: testnetViewKey,
      provableApi: { uuid, scannerStatus: { synced: false, percentage: 0 } },
    });

    // this fixture account has been fully scanned in the past, so its real status is synced
    expect(result).toEqual({
      uuid,
      scannerStatus: { synced: true, percentage: 100 },
    });
  });

  it("throws AleoApiConfigurationResetError for an unknown scanner uuid", async () => {
    await expect(
      accessProvableApi({
        currency,
        viewKey: testnetViewKey,
        provableApi: { uuid: "00000000-0000-0000-0000-000000000000" },
      }),
    ).rejects.toBeInstanceOf(AleoApiConfigurationResetError);
  });
});

describe("fetchAllOwnedRecords", () => {
  let uuid: string;

  beforeAll(async () => {
    const provableApi = await accessProvableApi({
      currency,
      viewKey: testnetViewKey,
      provableApi: null,
    });
    invariant(provableApi.uuid, "guard: missing uuid");
    uuid = provableApi.uuid;
  });

  it("returns an empty array for a fresh, never-used account", async () => {
    const pristineAccount = await getPristineAccount();

    const freshProvableApi = await accessProvableApi({
      currency,
      viewKey: pristineAccount.viewKey,
      provableApi: null,
    });
    invariant(freshProvableApi.uuid, "guard: missing uuid");

    const records = await fetchAllOwnedRecords({
      currency,
      uuid: freshProvableApi.uuid,
    });

    expect(records).toEqual([]);
  });

  it("paginates across multiple pages without gaps or duplicates", async () => {
    const fullFetch = await fetchAllOwnedRecords({ currency, uuid });
    const pagedFetch = await fetchAllOwnedRecords({
      currency,
      uuid,
      resultsPerPage: 2,
    });

    // guards that this fixture account has enough history to actually span multiple pages
    expect(pagedFetch.length).toBeGreaterThan(2);
    expect(pagedFetch.length).toBe(fullFetch.length);

    const uniqueCommitments = new Set(pagedFetch.map(r => r.commitment));
    expect(uniqueCommitments.size).toBe(pagedFetch.length);
  });

  it("returns only unspent records when unspent is true", async () => {
    const [fullFetch, unspentFetch] = await Promise.all([
      fetchAllOwnedRecords({ currency, uuid }),
      fetchAllOwnedRecords({ currency, uuid, unspent: true }),
    ]);

    expect(unspentFetch.length).toBeGreaterThan(0);
    expect(unspentFetch.every(record => !record.spent)).toBe(true);
    expect(unspentFetch.length).toBe(fullFetch.filter(record => !record.spent).length);
  });

  it("filters records by function name", async () => {
    const records = await fetchAllOwnedRecords({
      currency,
      uuid,
      functions: ["transfer_private"],
    });

    expect(records.length).toBeGreaterThan(0);
    expect(records.every(record => record.function_name === "transfer_private")).toBe(true);
  });
});

describe("patchPublicOperations", () => {
  it("splits a self conversion into a patched pair of IN/OUT operations", async () => {
    const op = toBridgeOperation(testnetLedgerAccountId, testnetSelfConversionTx, testnetAddress);

    const result = await patchPublicOperations({
      currency,
      publicOperations: [op],
      privateRecords: [testnetMatchingPrivateRecord],
      address: testnetAddress,
      ledgerAccountId: testnetLedgerAccountId,
      viewKey: testnetViewKey,
    });

    expect(result).toEqual([
      expect.objectContaining({
        type: "OUT",
        hash: testnetSelfConversionTx.transaction_id,
        senders: [testnetAddress],
        recipients: [testnetAddress],
        extra: expect.objectContaining({
          patched: true,
          transactionType: "public",
        }),
      }),
      expect.objectContaining({
        type: "IN",
        hash: testnetSelfConversionTx.transaction_id,
        senders: [testnetAddress],
        recipients: [testnetAddress],
        extra: expect.objectContaining({
          patched: true,
          transactionType: "private",
        }),
      }),
    ]);
  });

  it("decrypts the real recipient for a transfer to a different private account and marks it patched once private sync has caught up", async () => {
    const op = toBridgeOperation(
      testnetLedgerAccountId,
      testnetThirdPartyConversionTx,
      testnetAddress,
    );
    const caughtUpPrivateRecord: AleoPrivateRecord = {
      ...testnetMatchingPrivateRecord,
      transaction_id: "unrelated-tx",
      block_height: testnetThirdPartyConversionTx.block_number + 100,
    };

    const result = await patchPublicOperations({
      currency,
      publicOperations: [op],
      privateRecords: [caughtUpPrivateRecord],
      address: testnetAddress,
      ledgerAccountId: testnetLedgerAccountId,
      viewKey: testnetViewKey,
    });

    expect(result).toEqual([
      expect.objectContaining({
        type: "OUT",
        hash: testnetThirdPartyConversionTx.transaction_id,
        recipients: [testnetThirdPartyRealRecipient],
        extra: expect.objectContaining({ patched: true }),
      }),
    ]);
  });

  it("decrypts the real recipient but leaves it unpatched when private sync hasn't caught up", async () => {
    const op = toBridgeOperation(
      testnetLedgerAccountId,
      testnetThirdPartyConversionTx,
      testnetAddress,
    );

    const result = await patchPublicOperations({
      currency,
      publicOperations: [op],
      privateRecords: [],
      address: testnetAddress,
      ledgerAccountId: testnetLedgerAccountId,
      viewKey: testnetViewKey,
    });

    expect(result).toEqual([
      expect.objectContaining({
        hash: testnetThirdPartyConversionTx.transaction_id,
        recipients: [testnetThirdPartyRealRecipient],
        extra: expect.not.objectContaining({ patched: true }),
      }),
    ]);
  });

  it("passes an inbound private-to-public operation through unchanged", async () => {
    const op = toBridgeOperation(
      testnetLedgerAccountId,
      testnetInboundPrivateToPublicTx,
      testnetAddress,
    );

    const result = await patchPublicOperations({
      currency,
      publicOperations: [op],
      privateRecords: [],
      address: testnetAddress,
      ledgerAccountId: testnetLedgerAccountId,
      viewKey: testnetViewKey,
    });

    expect(result).toEqual([op]);
  });

  it("passes an already patched operation through unchanged without reprocessing", async () => {
    const op = toBridgeOperation(testnetLedgerAccountId, testnetSelfConversionTx, testnetAddress);
    const alreadyPatched = { ...op, extra: { ...op.extra, patched: true } };

    const result = await patchPublicOperations({
      currency,
      publicOperations: [alreadyPatched],
      privateRecords: [],
      address: testnetAddress,
      ledgerAccountId: testnetLedgerAccountId,
      viewKey: testnetViewKey,
    });

    expect(result).toEqual([alreadyPatched]);
  });

  it("passes fully public operations through without any patching", async () => {
    // synthetic transaction: this branch never touches the network, so no real chain
    // data is needed here.
    const fullyPublicTx: AleoPublicTransaction = {
      transaction_id: "at1fullypublictx",
      transition_id: "au1fullypublictx",
      transaction_status: "Accepted",
      block_number: 1,
      block_timestamp: "1700000000",
      function_id: "transfer_public",
      amount: 42,
      sender_address: testnetAddress,
      recipient_address: "aleo1dtadcxqsjp4fvvafv4ynlq9mp5vgwsap7djlzell8ngag7pj3uysdlhxjs",
      program_id: "credits.aleo",
      fee: 100,
      block_hash: "ab1fullypublictx",
    };
    const op = toBridgeOperation(testnetLedgerAccountId, fullyPublicTx, testnetAddress);

    const result = await patchPublicOperations({
      currency,
      publicOperations: [op],
      privateRecords: [],
      address: testnetAddress,
      ledgerAccountId: testnetLedgerAccountId,
      viewKey: testnetViewKey,
    });

    expect(result).toEqual([op]);
  });
});

describe("getTokenOutDetails", () => {
  it("decrypts amount and recipient for a fully private outgoing token transfer", async () => {
    const result = await getTokenOutDetails({
      currency,
      record: testnetOutgoingPrivateTokenRecord,
      viewKey: testnetViewKey,
    });

    expect(result).toEqual({
      amount: new BigNumber(1),
      recipient: "aleo1dtadcxqsjp4fvvafv4ynlq9mp5vgwsap7djlzell8ngag7pj3uysdlhxjs",
      fee: new BigNumber(4609),
    });
  });

  it("reads amount and recipient directly for a private-to-public conversion sent to a third party", async () => {
    const result = await getTokenOutDetails({
      currency,
      record: testnetOutgoingPrivateToPublicRecord,
      viewKey: testnetViewKey,
    });

    expect(result).toEqual({
      amount: new BigNumber(1),
      recipient: "aleo1dtadcxqsjp4fvvafv4ynlq9mp5vgwsap7djlzell8ngag7pj3uysdlhxjs",
      fee: new BigNumber(2826),
    });
  });

  it("falls back to null amount and recipient when the transition index is out of range", async () => {
    const result = await getTokenOutDetails({
      currency,
      record: {
        ...testnetOutgoingPrivateToPublicRecord,
        transition_index: 999,
      },
      viewKey: testnetViewKey,
    });

    // fee is still read from the transaction root, independent of the transition lookup
    expect(result).toEqual({
      amount: null,
      recipient: null,
      fee: new BigNumber(2826),
    });
  });
});
