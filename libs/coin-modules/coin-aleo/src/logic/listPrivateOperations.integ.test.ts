import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import aleoConfig from "../config";
import { getTestnetIntegConfig } from "../__tests__/fixtures/config.fixture";
import {
  testnetAddress,
  testnetConsumedRecordTag,
  testnetIncomingPrivateRecord1,
  testnetIncomingPrivateRecord2,
  testnetLedgerAccountId,
  testnetOutgoingChangeRecord,
  testnetViewKey,
} from "../__tests__/fixtures/api.fixture";
import { getPristineAccount } from "../__tests__/helpers/account";
import { listPrivateOperations } from "./listPrivateOperations";

describe("listPrivateOperations", () => {
  const currency = getCryptoCurrencyById("aleo_testnet");
  let emptyAddress: string;

  beforeAll(async () => {
    aleoConfig.setCoinConfig(() => getTestnetIntegConfig());
    const pristineAccount = await getPristineAccount();
    emptyAddress = pristineAccount.address;
  });

  it("returns private operations for a known testnet account with private records", async () => {
    const { operations } = await listPrivateOperations({
      currency,
      viewKey: testnetViewKey,
      address: testnetAddress,
      ledgerAccountId: testnetLedgerAccountId,
      privateRecords: [testnetIncomingPrivateRecord1, testnetIncomingPrivateRecord2],
    });

    expect(operations).toHaveLength(2);
    expect(operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "IN",
          hash: testnetIncomingPrivateRecord1.transaction_id.trim(),
          value: new BigNumber(1),
          date: new Date(testnetIncomingPrivateRecord1.block_timestamp * 1000),
          senders: [testnetIncomingPrivateRecord1.sender],
          recipients: [testnetAddress],
        }),
        expect.objectContaining({
          type: "IN",
          hash: testnetIncomingPrivateRecord2.transaction_id.trim(),
          value: new BigNumber(50000),
          date: new Date(testnetIncomingPrivateRecord2.block_timestamp * 1000),
          senders: [testnetIncomingPrivateRecord2.sender],
          recipients: [testnetAddress],
        }),
      ]),
    );
  });

  it("returns an empty result for an account with no private records", async () => {
    const result = await listPrivateOperations({
      currency,
      viewKey: testnetViewKey,
      address: emptyAddress,
      ledgerAccountId: `js:2:aleo_testnet:${emptyAddress}:`,
      privateRecords: [],
    });

    expect(result.operations).toEqual([]);
    expect(result.consumedRecordTags).toEqual(new Set());
  });

  it("marks a record consumed as input in an outgoing transaction as a consumed record tag", async () => {
    const { operations, consumedRecordTags } = await listPrivateOperations({
      currency,
      viewKey: testnetViewKey,
      address: testnetAddress,
      ledgerAccountId: testnetLedgerAccountId,
      privateRecords: [testnetOutgoingChangeRecord],
    });

    expect(consumedRecordTags.has(testnetConsumedRecordTag)).toBe(true);
    expect(operations).toEqual([
      expect.objectContaining({
        type: "OUT",
        hash: testnetOutgoingChangeRecord.transaction_id.trim(),
        senders: [testnetAddress],
      }),
    ]);
  });
});
