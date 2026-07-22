import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import aleoConfig from "../config";
import { getTestnetIntegConfig } from "../__tests__/fixtures/config.fixture";
import {
  referenceTransferPublicTx,
  TEST_TOKEN_PROGRAM_ID,
  testnetAddress,
  testnetLedgerAccountId,
} from "../__tests__/fixtures/api.fixture";
import { setupCalStore } from "../__tests__/helpers/cal";
import { listOperations } from "./listOperations";

describe("listOperations (bridge mode)", () => {
  const currency = getCryptoCurrencyById("aleo_testnet");
  const config = getTestnetIntegConfig();

  beforeAll(() => {
    setupCalStore();
    aleoConfig.setCoinConfig(() => config);
  });

  it("returns AleoOperation-shaped results with correct metadata for a known transaction", async () => {
    const result = await listOperations({
      config,
      currency,
      address: testnetAddress,
      ledgerAccountId: testnetLedgerAccountId,
      mode: "bridge",
      options: { minHeight: 0, limit: 10, order: "asc" },
    });

    const operation = result.operations.find(op => op.hash === referenceTransferPublicTx.id);

    expect(operation).toMatchObject({
      type: "IN",
      value: new BigNumber(referenceTransferPublicTx.value),
      senders: [referenceTransferPublicTx.sender],
      recipients: [referenceTransferPublicTx.recipient],
      hash: referenceTransferPublicTx.id,
      fee: new BigNumber(referenceTransferPublicTx.fee),
      blockHeight: referenceTransferPublicTx.blockHeight,
      blockHash: referenceTransferPublicTx.blockHash,
      accountId: testnetLedgerAccountId,
    });
  });

  it("ignores the limit option and paginates through every page up to the tip", async () => {
    const options = { minHeight: 15_500_000, order: "asc" as const };

    const [smallPageSize, largePageSize] = await Promise.all([
      listOperations({
        config,
        currency,
        address: testnetAddress,
        ledgerAccountId: testnetLedgerAccountId,
        mode: "bridge",
        options: { ...options, limit: 5 },
      }),
      listOperations({
        config,
        currency,
        address: testnetAddress,
        ledgerAccountId: testnetLedgerAccountId,
        mode: "bridge",
        options: { ...options, limit: 50 },
      }),
    ]);

    // guards that this window actually spans more than a single page at the smallest size
    expect(smallPageSize.operations.length).toBeGreaterThan(5);
    expect(smallPageSize.operations.length).toBe(largePageSize.operations.length);
    expect(smallPageSize.nextCursor).toBeNull();
    expect(largePageSize.nextCursor).toBeNull();

    const smallIds = smallPageSize.operations.map(op => op.id).sort();
    const largeIds = largePageSize.operations.map(op => op.id).sort();
    expect(smallIds).toEqual(largeIds);
  });

  it("resolves CAL tokens and token operations for a testnet token program", async () => {
    const result = await listOperations({
      config: { ...config, enableTokens: true },
      currency,
      address: testnetAddress,
      ledgerAccountId: testnetLedgerAccountId,
      mode: "bridge",
      options: { minHeight: 0, limit: 50, order: "asc" },
    });

    expect(result.calTokens.get(TEST_TOKEN_PROGRAM_ID)?.id).toBe("aleo_testnet/arc22/test_usad");
    expect(result.tokenOperations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountId: testnetLedgerAccountId,
          extra: expect.objectContaining({ programId: TEST_TOKEN_PROGRAM_ID }),
        }),
      ]),
    );
  });
});
