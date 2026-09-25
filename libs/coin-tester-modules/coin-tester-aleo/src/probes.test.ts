import { firstValueFrom, reduce, tap, toArray } from "rxjs";
import { setupServer } from "msw/node";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import BigNumber from "bignumber.js";
import {
  TRANSACTION_TYPE,
  MAX_PRIVATE_RECORDS_PER_TRANSACTION,
} from "@ledgerhq/coin-aleo/constants";
import type {
  AleoAccount,
  Transaction as AleoTransaction,
  TransactionPrivate as AleoTransactionPrivate,
  PreparedRequestResponse,
} from "@ledgerhq/coin-aleo/types";
import { craftTransaction } from "@ledgerhq/coin-aleo/logic/craftTransaction";
import { createTransactionIntent, fromHex } from "@ledgerhq/coin-aleo/logic/utils";
import { advanceBlocks, killStack, registerTeardownHooks, spawnStack } from "./stack";
import {
  PROBE_ADDRESS,
  TRANSFER_PRIVATE_BASE_FEE,
  TRANSFER_PUBLIC_BASE_FEE,
  buildAleoCoinConfig,
  generateAleoAccount,
  makePrivateAleoAccount,
  type GeneratedAleoAccount,
} from "./fixtures";
import { mintPrivateRecord } from "./mint";
import { getTransaction } from "./devnode";
import type { DevnodeConfirmedTransaction } from "./devnode";
import { parseFee } from "./msw/indexer";
import { buildTransaction } from "./msw/prove";
import { buildAleoHandlers, buildScannerHandlers } from "./msw/handlers";
import { createFakeScanner } from "./msw/scanner";
import { buildMockAleoSigner } from "./signer";
import { getBridges } from "./helpers";
import { loadAleoWasm } from "./wasm";

jest.setTimeout(600_000);

registerTeardownHooks();

beforeAll(async () => {
  await spawnStack();
});

afterAll(async () => {
  await killStack();
});

describe("Probe A — the real devnode fee for transfer_public", () => {
  it("charges a fee_public below the TRANSFER_PUBLIC_BASE_FEE the bridge bills", async () => {
    const { id } = await buildTransaction({ recipient: PROBE_ADDRESS, amount: 2_000_000 });
    await advanceBlocks(1);

    const transaction = await getTransaction(id);
    const fee = parseFee({
      status: "accepted",
      type: "execute",
      transaction,
    } as DevnodeConfirmedTransaction);

    console.log(
      `PROBE A: devnode fee_public = ${fee} microcredits; ` +
        `bridge bills ${TRANSFER_PUBLIC_BASE_FEE}; ` +
        `send-max leftover = ${TRANSFER_PUBLIC_BASE_FEE - fee}`,
    );

    expect(fee).toBeLessThan(TRANSFER_PUBLIC_BASE_FEE);
  });
});

/**
 * The prepared request carries program ids, function names and value types as
 * their snarkVM byte encodings, hex-printed. Each is a run of length-prefixed
 * ASCII, so the readable name is whatever printable bytes it holds.
 */
function readEncodedName(hex: string): string {
  return Buffer.from(hex, "hex")
    .toString("latin1")
    .replace(/[^\x20-\x7e]+/g, ".")
    .replace(/^\.|\.$/g, "");
}

/** Prints a prepared-request tree: program, function, and how many record inputs each carries. */
function describeRequest(request: PreparedRequestResponse, depth = 0): string[] {
  const types = request.input_types.map(readEncodedName);
  // A `credits.record` input decodes to `credits.aleo.credits` when the record
  // type is external to the calling program, and to a bare `credits` when it is
  // not; every other input type here is non-ASCII and decodes to nothing.
  const records = types.filter(type => type.endsWith("credits")).length;
  const line =
    `${"  ".repeat(depth)}- ${readEncodedName(request.program_id)}/` +
    `${readEncodedName(request.function_name)} is_root=${request.is_root} ` +
    `inputs=${types.length} recordInputs=${records} [${types.join(", ")}]`;
  return [line, ...(request.nested_calls ?? []).flatMap(call => describeRequest(call, depth + 1))];
}

describe("Probe B — the authorization for a 15-record send-max", () => {
  const RECORD_COUNT = 15;
  /** The one record that must stay out of the amount set and pay the fee. */
  const SMALLEST_RECORD = 50_000;

  let owner: GeneratedAleoAccount;
  let recipient: GeneratedAleoAccount;
  let synced: AleoAccount;
  let prepared: AleoTransaction;
  const mockServer = setupServer();

  beforeAll(
    async () => {
      setCryptoAssetsStore({
        findTokenById: async () => undefined,
        findTokenByAddressInCurrency: async () => undefined,
        getTokensSyncHash: async () => "",
      });

      [owner, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

      // 14 records well above the smallest one, each a distinct size so the
      // selection is deterministic, plus the single smallest that must be left
      // over for the fee.
      for (let index = 0; index < RECORD_COUNT - 1; index++) {
        await mintPrivateRecord(owner.address, 1_000_000 + index * 10_000);
      }
      await mintPrivateRecord(owner.address, SMALLEST_RECORD);

      const scanner = createFakeScanner();
      await scanner.setup();
      scanner.registerAccount({ viewKey: owner.viewKey, address: owner.address });

      mockServer.listen({
        onUnhandledRequest: request => {
          const { hostname } = new URL(request.url);
          if (["127.0.0.1", "localhost"].includes(hostname)) return;
          throw new Error(`Unhandled request: ${request.method} ${request.url}`);
        },
      });
      mockServer.use(
        ...buildAleoHandlers({ recipient: recipient.address, amount: 0 }),
        ...buildScannerHandlers(scanner),
      );

      const signer = buildMockAleoSigner(owner.privateKey);
      const { accountBridge } = getBridges(signer, buildAleoCoinConfig());
      const account = makePrivateAleoAccount(owner.address, owner.viewKey);

      synced = await firstValueFrom(
        accountBridge
          .sync(account, { paginationConfig: {} })
          .pipe(reduce((acc, applyPatch) => applyPatch(acc), account)),
      );

      const transaction: AleoTransactionPrivate = {
        ...accountBridge.createTransaction(synced),
        mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        recipient: recipient.address,
        amount: new BigNumber(0),
        useAllAmount: true,
        properties: { amountRecordCommitments: [], feeRecordCommitment: null },
      } as AleoTransactionPrivate;

      prepared = await accountBridge.prepareTransaction(synced, transaction);
    },
    15 * 60 * 1000,
  );

  afterAll(() => {
    mockServer.close();
  });

  it("syncs all 15 minted records", () => {
    expect(synced.aleoResources?.unspentPrivateRecords).toHaveLength(RECORD_COUNT);
  });

  it("selects 14 amount records and leaves the smallest one for the fee", () => {
    const properties = (prepared as AleoTransactionPrivate).properties;
    const records = synced.aleoResources!.unspentPrivateRecords!;
    const smallest = records.reduce((min, record) =>
      new BigNumber(record.microcredits).lt(min.microcredits) ? record : min,
    );

    console.log(
      `PROBE B: amountRecordCommitments=${properties.amountRecordCommitments.length} ` +
        `feeRecordCommitment=${properties.feeRecordCommitment} ` +
        `smallestRecord=${smallest.microcredits} (${smallest.commitment}) ` +
        `preparedAmount=${prepared.amount.toString()}`,
    );

    expect(properties.amountRecordCommitments).toHaveLength(MAX_PRIVATE_RECORDS_PER_TRANSACTION);
    expect(properties.feeRecordCommitment).toBe(smallest.commitment);
    expect(Number(smallest.microcredits)).toBeGreaterThan(TRANSFER_PRIVATE_BASE_FEE);

    const expectedAmount = records
      .filter(record => properties.amountRecordCommitments.includes(record.commitment))
      .reduce((sum, record) => sum.plus(record.microcredits), new BigNumber(0));
    expect(prepared.amount).toStrictEqual(expectedAmount);
  });

  it("records what the sign path does with 14 records", async () => {
    const signer = buildMockAleoSigner(owner.privateKey);
    const { accountBridge } = getBridges(signer, buildAleoCoinConfig());

    const events: string[] = [];
    let failure: unknown;
    try {
      // toArray, not firstValueFrom: signOperation emits device-streaming before
      // it ever reaches the signer, so taking the first emission hides the throw.
      await firstValueFrom(
        accountBridge.signOperation({ account: synced, transaction: prepared, deviceId: "" }).pipe(
          tap(event => events.push(event.type)),
          toArray(),
        ),
      );
    } catch (error) {
      failure = error;
    }

    console.log(
      `PROBE B: signOperation with 14 records emitted [${events.join(", ")}] then => ` +
        (failure instanceof Error ? failure.message : String(failure)),
    );

    // No assertion: the probe reports the shape of the blocker, it does not pin it.
    expect(true).toBe(true);
  });

  it("reports the prepared-request tree the backend builds for 14 records", async () => {
    const wasm = await loadAleoWasm();

    // The device derives one TVK per transition, in [root, joins..., transfer]
    // order. These are placeholders: the backend only embeds them (each join's
    // output nonce is derived from one), so they are enough to observe the
    // request tree, and nothing here is signed or broadcast.
    const tvks = Array.from({ length: MAX_PRIVATE_RECORDS_PER_TRANSACTION + 1 }, (_, index) =>
      Buffer.from(wasm.Field.fromString(`${index + 1}field`).toBytesLe()).toString("hex"),
    );
    const intent = createTransactionIntent({ account: synced, transaction: prepared, tvks });

    let request: PreparedRequestResponse | undefined;
    let failure: unknown;
    try {
      const crafted = await craftTransaction({
        config: buildAleoCoinConfig(),
        viewKey: owner.viewKey,
        feeConfiguration: {
          function_name: "fee_private",
          max_base_fee: String(TRANSFER_PRIVATE_BASE_FEE),
          max_priority_fee: "0",
        },
        txIntent: intent,
      });
      request = fromHex<PreparedRequestResponse>(crafted.transaction);
    } catch (error) {
      failure = error;
    }

    if (request) {
      console.log(
        [
          `PROBE B: intent type = ${(intent as { type: string }).type}`,
          "PROBE B: prepared request tree:",
          ...describeRequest(request),
          `PROBE B: flattened request count (root + nested) = ${describeRequest(request).length}`,
        ].join("\n"),
      );
    } else {
      console.log(
        `PROBE B: /transactions/request refused the 14-record intent => ` +
          (failure instanceof Error ? failure.message : String(failure)),
      );
    }

    expect(true).toBe(true);
  });
});
