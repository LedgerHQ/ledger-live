import BigNumber from "bignumber.js";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import {
  getMockedEnrichedPrivateRecord,
  getMockedPublicTransaction,
  getMockedRecord,
  getMockedRecordScannerStatus,
  getMockedTokenDetails,
  getMockedTransactionDetails,
} from "../__tests__/fixtures/api.fixture";
import { apiClient } from "../network/api";
import {
  enrichPrivateRecords,
  fetchAllOwnedRecords,
  fetchAllTokens,
  fetchTransitionPage,
  getRecordScannerStatusOrThrow,
  resolveTransferArguments,
} from "../network/utils";
import { lastBlock } from "./lastBlock";
import { listOperations } from "./listOperations";

jest.mock("../network/utils");
jest.mock("../network/api");
jest.mock("./lastBlock");

const mockedFetchTransitionPage = jest.mocked(fetchTransitionPage);
const mockedFetchAllOwnedRecords = jest.mocked(fetchAllOwnedRecords);
const mockedGetRecordScannerStatusOrThrow = jest.mocked(getRecordScannerStatusOrThrow);
const mockedLastBlock = jest.mocked(lastBlock);
const mockedEnrichPrivateRecords = jest.mocked(enrichPrivateRecords);
const mockedFetchAllTokens = jest.mocked(fetchAllTokens);
const mockedResolveTransferArguments = jest.mocked(resolveTransferArguments);
const mockedGetTransactionById = jest.mocked(apiClient.getTransactionById);

const config = getMockedConfig("mainnet");
const address = "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr";
const recipient = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
const provableId = "uuid1field";
const viewKey = "AViewKey1test";

const run = (options: Omit<Parameters<typeof listOperations>[0]["options"], "order">) =>
  listOperations({ config, address, options: { ...options, order: "desc" }, provableId, viewKey });

const runAsc = (options: Omit<Parameters<typeof listOperations>[0]["options"], "order">) =>
  listOperations({ config, address, options: { ...options, order: "asc" }, provableId, viewKey });

beforeEach(() => {
  jest.clearAllMocks();

  mockedLastBlock.mockResolvedValue({ hash: "ab1tip", height: 1000, time: new Date() });
  mockedGetRecordScannerStatusOrThrow.mockResolvedValue(
    getMockedRecordScannerStatus({ synced_up_to: 900 }),
  );
  mockedFetchTransitionPage.mockResolvedValue({ transitions: [], next: null });
  mockedFetchAllOwnedRecords.mockResolvedValue([]);
  mockedEnrichPrivateRecords.mockResolvedValue([]);
  mockedFetchAllTokens.mockResolvedValue([]);
  mockedGetTransactionById.mockResolvedValue(getMockedTransactionDetails());
  mockedResolveTransferArguments.mockResolvedValue(null);
});

describe("listOperations", () => {
  it("should emit one operation per transaction, collapsing its transitions", async () => {
    mockedFetchTransitionPage.mockResolvedValue({
      transitions: [
        // batcher inner call, no addresses: must lose to the row carrying the transfer
        getMockedPublicTransaction({
          transaction_id: "at1multi",
          transition_id: "au1inner",
          block_number: 500,
          sender_address: "",
          recipient_address: "",
          function_id: "burn_public",
        }),
        getMockedPublicTransaction({
          transaction_id: "at1multi",
          transition_id: "au1real",
          block_number: 500,
        }),
      ],
      next: null,
    });

    const { items } = await run({ minHeight: 0 });

    expect(items).toEqual([
      expect.objectContaining({
        id: "at1multi",
        details: expect.objectContaining({ functionId: "transfer_public" }),
      }),
    ]);
  });

  it("should withhold blocks above the scanner watermark", async () => {
    mockedFetchTransitionPage.mockResolvedValue({
      transitions: [
        getMockedPublicTransaction({ transaction_id: "at1below", block_number: 800 }),
        getMockedPublicTransaction({ transaction_id: "at1above", block_number: 950 }),
      ],
      next: null,
    });

    const { items } = await run({ minHeight: 0 });

    expect(items.map(op => op.id)).toEqual(["at1below"]);
  });

  it("should return an empty page when the scanner reports no covered height", async () => {
    mockedGetRecordScannerStatusOrThrow.mockResolvedValue(
      getMockedRecordScannerStatus({ synced: false, percentage: 10, synced_up_to: null }),
    );

    const result = await run({ minHeight: 5 });

    expect(result).toEqual({ items: [], next: undefined });
    expect(mockedFetchTransitionPage).not.toHaveBeenCalled();
  });

  it("should cap the watermark at the chain tip", async () => {
    mockedLastBlock.mockResolvedValue({ hash: "ab1tip", height: 600, time: new Date() });
    mockedFetchTransitionPage.mockResolvedValue({
      transitions: [getMockedPublicTransaction({ transaction_id: "at1a", block_number: 700 })],
      next: null,
    });

    const { items } = await run({ minHeight: 0 });

    expect(items).toEqual([]);
  });

  it("should pin the watermark in the cursor so later pages see one snapshot", async () => {
    mockedFetchTransitionPage.mockResolvedValue({
      transitions: [getMockedPublicTransaction({ transaction_id: "at1a", block_number: 500 })],
      next: { blockNumber: 500, transitionId: "au1a" },
    });

    const { next } = await run({ minHeight: 0 });

    expect(next).toBe("900:500:au1a");
  });

  it("should resume below the block a cursor already emitted whole", async () => {
    mockedFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({ transaction_id: "at1done", block_height: 500 }),
      getMockedRecord({ transaction_id: "at1next", block_height: 499 }),
    ]);

    await run({ minHeight: 0, cursor: "900:500:au1a" });

    expect(mockedFetchTransitionPage).toHaveBeenCalledTimes(1);
    expect(mockedFetchTransitionPage).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { blockNumber: 500, transitionId: "au1a" } }),
    );
    // block 500 was emitted whole by the previous page, so only what sits below it is left
    expect(mockedEnrichPrivateRecords).toHaveBeenCalledTimes(1);
    expect(mockedEnrichPrivateRecords).toHaveBeenCalledWith(
      expect.objectContaining({
        records: [expect.objectContaining({ transaction_id: "at1next" })],
      }),
    );
  });

  it("should open a descending window above the watermark", async () => {
    await run({ minHeight: 0 });

    expect(mockedFetchTransitionPage).toHaveBeenCalledTimes(1);
    expect(mockedFetchTransitionPage).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { blockNumber: 901 }, order: "desc" }),
    );
  });

  it("should drop the cursor once the stream leaves the window", async () => {
    mockedFetchTransitionPage.mockResolvedValue({
      transitions: [
        getMockedPublicTransaction({ transaction_id: "at1in", block_number: 500 }),
        getMockedPublicTransaction({ transaction_id: "at1out", block_number: 300 }),
      ],
      next: { blockNumber: 300, transitionId: "au1out" },
    });

    const { items, next } = await run({ minHeight: 400 });

    expect(items.map(op => op.id)).toEqual(["at1in"]);
    expect(next).toBeUndefined();
  });

  it("should tag a public row when the account owns a record of the same transaction", async () => {
    mockedFetchTransitionPage.mockResolvedValue({
      transitions: [
        getMockedPublicTransaction({
          transaction_id: "at1shield",
          block_number: 500,
          function_id: "transfer_public_to_private",
          recipient_address: "",
        }),
      ],
      next: null,
    });
    mockedFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({ transaction_id: "at1shield", block_height: 500 }),
    ]);

    const { items } = await run({ minHeight: 0 });

    expect(items).toEqual([expect.objectContaining({ recipients: [address] })]);
    expect(mockedEnrichPrivateRecords).toHaveBeenCalledTimes(1);
    expect(mockedEnrichPrivateRecords).toHaveBeenCalledWith(
      expect.objectContaining({ records: [] }),
    );
    // an owned record already reveals the counterparty, so no transition lookup is needed
    expect(mockedGetTransactionById).not.toHaveBeenCalled();
  });

  it("should keep a batcher-wrapped record and leave the scanner filters off", async () => {
    mockedFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({
        transaction_id: "at1batched",
        block_height: 500,
        function_name: "transfer_private_2",
      }),
    ]);
    mockedEnrichPrivateRecords.mockResolvedValue([
      getMockedEnrichedPrivateRecord({
        rawRecord: { transaction_id: "at1batched", block_height: 500 },
        sender: recipient,
        recipient: address,
      }),
    ]);

    const { items } = await run({ minHeight: 0 });

    // both scanner filters are exact-name matches, so they must stay off
    expect(mockedFetchAllOwnedRecords).toHaveBeenCalledTimes(1);
    expect(mockedFetchAllOwnedRecords).toHaveBeenCalledWith(
      expect.objectContaining({ programs: [], functions: [] }),
    );
    expect(items).toEqual([expect.objectContaining({ id: "at1batched" })]);
  });

  it("should bound the record fetch by the page's block window", async () => {
    mockedFetchTransitionPage.mockResolvedValue({
      transitions: [getMockedPublicTransaction({ transaction_id: "at1a", block_number: 500 })],
      next: { blockNumber: 500, transitionId: "au1a" },
    });

    await run({ minHeight: 400 });

    // descending: this page covers [500, 900], so the scanner must not stream the tail below it
    expect(mockedFetchAllOwnedRecords).toHaveBeenCalledTimes(1);
    expect(mockedFetchAllOwnedRecords).toHaveBeenCalledWith(
      expect.objectContaining({ start: 500, end: 900 }),
    );
  });

  it("should drop a record whose function transfers nothing", async () => {
    mockedFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({ transaction_id: "at1join", block_height: 500, function_name: "join" }),
    ]);

    const { items } = await run({ minHeight: 0 });

    expect(mockedEnrichPrivateRecords).toHaveBeenCalledTimes(1);
    expect(mockedEnrichPrivateRecords).toHaveBeenCalledWith(
      expect.objectContaining({ records: [] }),
    );
    expect(items).toEqual([]);
  });

  it("should emit an operation for a record whose transaction has no public row", async () => {
    mockedFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({ transaction_id: "at1private", block_height: 500 }),
    ]);
    mockedEnrichPrivateRecords.mockResolvedValue([
      getMockedEnrichedPrivateRecord({
        rawRecord: { transaction_id: "at1private", block_height: 500 },
        sender: recipient,
        recipient: address,
        value: new BigNumber(42),
      }),
    ]);

    const { items } = await run({ minHeight: 0 });

    expect(items).toEqual([expect.objectContaining({ id: "at1private", type: "IN", value: 42n })]);
  });

  it("should drop records outside the page's block window", async () => {
    mockedFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({ transaction_id: "at1late", block_height: 950 }),
    ]);

    await run({ minHeight: 0 });

    expect(mockedEnrichPrivateRecords).toHaveBeenCalledTimes(1);
    expect(mockedEnrichPrivateRecords).toHaveBeenCalledWith(
      expect.objectContaining({ records: [] }),
    );
  });

  it("should type a token operation from the registry's standard", async () => {
    mockedFetchTransitionPage.mockResolvedValue({
      transitions: [
        getMockedPublicTransaction({
          transaction_id: "at1token",
          block_number: 500,
          program_id: "arc20_eth.aleo",
        }),
      ],
      next: null,
    });
    mockedFetchAllTokens.mockResolvedValue([
      getMockedTokenDetails({ program_name: "arc20_eth.aleo", token_standard: "ARC-20" }),
    ]);

    const { items } = await run({ minHeight: 0 });

    expect(items).toEqual([
      expect.objectContaining({
        asset: { type: "arc20", assetReference: "arc20_eth.aleo" },
      }),
    ]);
  });

  it("should reject a malformed cursor", async () => {
    await expect(run({ minHeight: 0, cursor: "not-a-cursor" })).rejects.toThrow(
      "malformed listOperations cursor",
    );
  });

  it("should keep the lowest addressed transition when a transaction has several", async () => {
    mockedFetchTransitionPage.mockResolvedValue({
      transitions: [
        getMockedPublicTransaction({
          transaction_id: "at1multi",
          transition_id: "au1second",
          block_number: 500,
          function_id: "transfer_public_second",
        }),
        getMockedPublicTransaction({
          transaction_id: "at1multi",
          transition_id: "au1first",
          block_number: 500,
        }),
      ],
      next: null,
    });

    const { items } = await run({ minHeight: 0 });

    expect(items).toEqual([
      expect.objectContaining({
        details: expect.objectContaining({ functionId: "transfer_public" }),
      }),
    ]);
  });

  it("should emit one operation for a self-transfer owning both output and change record", async () => {
    const output = getMockedRecord({
      transaction_id: "at1self",
      block_height: 500,
      output_index: 0,
      commitment: "cm1output",
    });
    mockedFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({
        transaction_id: "at1self",
        block_height: 500,
        output_index: 1,
        commitment: "cm1change",
      }),
      output,
    ]);
    mockedEnrichPrivateRecords.mockResolvedValue([
      getMockedEnrichedPrivateRecord({
        rawRecord: { transaction_id: "at1self", block_height: 500 },
        sender: address,
        recipient: address,
        value: new BigNumber(7),
      }),
    ]);

    const { items } = await run({ minHeight: 0 });

    expect(mockedEnrichPrivateRecords).toHaveBeenCalledTimes(1);
    expect(mockedEnrichPrivateRecords).toHaveBeenCalledWith(
      expect.objectContaining({ records: [output] }),
    );
    expect(items).toEqual([expect.objectContaining({ id: "at1self", value: 7n })]);
  });

  it("should read a third-party shield recipient back from the transition inputs", async () => {
    mockedFetchTransitionPage.mockResolvedValue({
      transitions: [
        getMockedPublicTransaction({
          transaction_id: "at1shield3p",
          block_number: 500,
          function_id: "transfer_public_to_private",
          sender_address: address,
          recipient_address: "",
        }),
      ],
      next: null,
    });
    mockedResolveTransferArguments.mockResolvedValue({ recipient, amount: "42u64" });

    const { items } = await run({ minHeight: 0 });

    expect(mockedGetTransactionById).toHaveBeenCalledTimes(1);
    expect(mockedGetTransactionById).toHaveBeenCalledWith(config, "at1shield3p");
    expect(items).toEqual([expect.objectContaining({ type: "OUT", recipients: [recipient] })]);
  });

  it("should read a batcher-wrapped shield recipient back too", async () => {
    mockedFetchTransitionPage.mockResolvedValue({
      transitions: [
        getMockedPublicTransaction({
          transaction_id: "at1shieldbatched",
          block_number: 500,
          function_id: "transfer_public_to_private_4",
          sender_address: address,
          recipient_address: "",
        }),
      ],
      next: null,
    });
    mockedResolveTransferArguments.mockResolvedValue({ recipient, amount: "42u64" });

    const { items } = await run({ minHeight: 0 });

    expect(mockedGetTransactionById).toHaveBeenCalledTimes(1);
    expect(items).toEqual([expect.objectContaining({ recipients: [recipient] })]);
  });

  it("should leave the recipient blank when the transition inputs cannot be read", async () => {
    mockedFetchTransitionPage.mockResolvedValue({
      transitions: [
        getMockedPublicTransaction({
          transaction_id: "at1shield3p",
          block_number: 500,
          function_id: "transfer_public_to_private",
          sender_address: address,
          recipient_address: "",
        }),
      ],
      next: null,
    });

    const { items } = await run({ minHeight: 0 });

    expect(items).toEqual([expect.objectContaining({ recipients: [""] })]);
  });

  it("should resume above the block a cursor already emitted whole when ascending", async () => {
    mockedFetchAllOwnedRecords.mockResolvedValue([
      getMockedRecord({ transaction_id: "at1done", block_height: 500 }),
      getMockedRecord({ transaction_id: "at1next", block_height: 501 }),
    ]);

    await runAsc({ minHeight: 0, cursor: "900:500:au1a" });

    expect(mockedFetchAllOwnedRecords).toHaveBeenCalledTimes(1);
    expect(mockedFetchAllOwnedRecords).toHaveBeenCalledWith(
      expect.objectContaining({ start: 501, end: 900 }),
    );
    expect(mockedEnrichPrivateRecords).toHaveBeenCalledTimes(1);
    expect(mockedEnrichPrivateRecords).toHaveBeenCalledWith(
      expect.objectContaining({
        records: [expect.objectContaining({ transaction_id: "at1next" })],
      }),
    );
  });

  it("should sort operations from the newest block down", async () => {
    mockedFetchTransitionPage.mockResolvedValue({
      transitions: [
        getMockedPublicTransaction({ transaction_id: "at1low", block_number: 400 }),
        getMockedPublicTransaction({ transaction_id: "at1high", block_number: 600 }),
      ],
      next: null,
    });

    const { items } = await run({ minHeight: 0 });

    expect(items.map(op => op.id)).toEqual(["at1high", "at1low"]);
  });
});
