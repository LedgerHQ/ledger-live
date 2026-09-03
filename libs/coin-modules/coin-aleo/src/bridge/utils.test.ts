import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import {
  getMockedCurrency,
  getMockedTokenCurrency,
  MOCK_TOKEN_PROGRAM_ID,
} from "../__tests__/fixtures/currency.fixture";
import {
  getMockedEnrichedPrivateRecord,
  getMockedTransaction as getMockedPublicTransaction,
} from "../__tests__/fixtures/api.fixture";
import { TRANSACTION_TYPE } from "../constants";
import type { AleoPublicTransaction } from "../types";
import { getCalTokens, toBridgeOperation, toPrivateBridgeOperation } from "./utils";

jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

const mockCurrency = getMockedCurrency();
const mockTokenCurrency = getMockedTokenCurrency();

describe("toBridgeOperation", () => {
  const ledgerAccountId = "js:2:aleo:aleo1test:";
  const recipientAddress = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
  const senderAddress = "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr";

  beforeEach(() => {
    jest.mocked(log).mockClear();
  });

  it("should produce an operation with encoded id and accountId", () => {
    const rawTx = getMockedPublicTransaction();
    const expectedId = encodeOperationId(ledgerAccountId, rawTx.transaction_id, "IN");

    const result = toBridgeOperation(ledgerAccountId, rawTx, recipientAddress);

    expect(result.id).toBe(expectedId);
    expect(result.accountId).toBe(ledgerAccountId);
  });

  it("should derive all operation fields from rawTx", () => {
    const rawTx = getMockedPublicTransaction();

    const result = toBridgeOperation(ledgerAccountId, rawTx, recipientAddress);

    expect(result.hash).toBe(rawTx.transaction_id);
    expect(result.type).toBe("IN");
    expect(result.value).toEqual(new BigNumber(rawTx.amount));
    expect(result.fee).toEqual(new BigNumber(rawTx.fee));
    expect(result.senders).toEqual([rawTx.sender_address]);
    expect(result.recipients).toEqual([rawTx.recipient_address]);
    expect(result.blockHeight).toBe(rawTx.block_number);
    expect(result.blockHash).toBe(rawTx.block_hash);
    expect(result.hasFailed).toBe(false);
  });

  it("should use amount_u128 over amount when provided, including values beyond JS safe integer range", () => {
    const amountU128 = "123456789012345678901234567890";
    const rawTx = getMockedPublicTransaction({ amount: 10000000, amount_u128: amountU128 });

    const result = toBridgeOperation(ledgerAccountId, rawTx, recipientAddress);

    expect(result.value).toEqual(new BigNumber(amountU128));
  });

  it("should generate different ids for different account ids", () => {
    const rawTx = getMockedPublicTransaction();
    const otherId = "js:2:aleo:aleo1other:";

    const result1 = toBridgeOperation(ledgerAccountId, rawTx, recipientAddress);
    const result2 = toBridgeOperation(otherId, rawTx, recipientAddress);

    expect(result1.id).not.toBe(result2.id);
    expect(result1.accountId).toBe(ledgerAccountId);
    expect(result2.accountId).toBe(otherId);
  });

  it("should set type to OUT when address is the sender", () => {
    const rawTx = getMockedPublicTransaction();

    const result = toBridgeOperation(ledgerAccountId, rawTx, senderAddress);

    expect(result.type).toBe("OUT");
    expect(result.id).toBe(encodeOperationId(ledgerAccountId, rawTx.transaction_id, "OUT"));
  });

  it("should attach programId when the transaction is a token transfer", () => {
    const rawTx = getMockedPublicTransaction({
      program_id: "usdcx_stablecoin.aleo",
    });

    const result = toBridgeOperation(ledgerAccountId, rawTx, recipientAddress, true);

    expect(result.extra.programId).toBe("usdcx_stablecoin.aleo");
  });

  it.each([
    ["NaN amount", { amount: NaN as number }],
    ["negative amount", { amount: -1 }],
  ])("should log invalid raw transaction details for %s", (_label, amountOverride) => {
    const rawTx = getMockedPublicTransaction(amountOverride);

    const result = toBridgeOperation(ledgerAccountId, rawTx, recipientAddress);

    expect(log).toHaveBeenCalledWith(
      "aleo/toBridgeOperation",
      `Invalid raw transaction details for ${recipientAddress}`,
      rawTx,
    );
    expect(result.value).toEqual(new BigNumber(rawTx.amount));
  });

  it("should log a zero amount apart from invalid details for transfer functions", () => {
    const rawTx = getMockedPublicTransaction({ amount: 0, function_id: "transfer_private" });

    toBridgeOperation(ledgerAccountId, rawTx, recipientAddress);

    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(
      "aleo/toBridgeOperation",
      `Zero value transaction for ${recipientAddress}`,
      rawTx,
    );
  });

  it("should not log when amount is valid", () => {
    const rawTx = getMockedPublicTransaction();

    toBridgeOperation(ledgerAccountId, rawTx, recipientAddress);

    expect(log).not.toHaveBeenCalled();
  });
  describe("staking operations", () => {
    const VALIDATOR = "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t";
    const stakingTx = (functionId: string, overrides?: Partial<AleoPublicTransaction>) =>
      getMockedPublicTransaction({
        function_id: functionId,
        // the indexer blanks both sides of every staking call
        sender_address: "",
        recipient_address: "",
        amount: 0,
        ...overrides,
      });

    it.each([
      [TRANSACTION_TYPE.BOND_PUBLIC, "BOND"],
      [TRANSACTION_TYPE.UNBOND_PUBLIC, "UNBOND"],
      [TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC, "WITHDRAW_UNBONDED"],
    ])("should leave both counterparties empty for %s", (functionId, expectedType) => {
      const result = toBridgeOperation(ledgerAccountId, stakingTx(functionId), senderAddress);

      expect(result.type).toBe(expectedType);
      expect(result.senders).toEqual([]);
      expect(result.recipients).toEqual([]);
    });

    it("should carry the fetched validator and amount for a bond", () => {
      const result = toBridgeOperation(
        ledgerAccountId,
        stakingTx(TRANSACTION_TYPE.BOND_PUBLIC),
        senderAddress,
        false,
        { validator: VALIDATOR, amount: new BigNumber("2982828466682") },
      );

      expect(result.extra.validator).toBe(VALIDATOR);
      expect(result.extra.stakedAmount).toEqual(new BigNumber("2982828466682"));
    });

    it("should take the unbonded amount from the listing row, which does publish it", () => {
      const result = toBridgeOperation(
        ledgerAccountId,
        stakingTx(TRANSACTION_TYPE.UNBOND_PUBLIC, { amount: 6939080344 }),
        senderAddress,
      );

      expect(result.extra.stakedAmount).toEqual(new BigNumber(6939080344));
      expect(result.extra.validator).toBeUndefined();
    });

    it("should carry no amount for a claim, which records none on-chain", () => {
      const result = toBridgeOperation(
        ledgerAccountId,
        stakingTx(TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC),
        senderAddress,
      );

      expect(result.extra.stakedAmount).toBeUndefined();
      expect(result.extra.validator).toBeUndefined();
    });

    // A non-credits program may expose a same-named function; only credits.aleo staking counts.
    it("should treat a bond_public on another program as a normal transfer", () => {
      const rawTx = stakingTx(TRANSACTION_TYPE.BOND_PUBLIC, {
        program_id: MOCK_TOKEN_PROGRAM_ID,
        sender_address: senderAddress,
        recipient_address: recipientAddress,
      });

      const result = toBridgeOperation(ledgerAccountId, rawTx, senderAddress);

      expect(result.senders).toEqual([senderAddress]);
      expect(result.recipients).toEqual([recipientAddress]);
    });
  });
});

describe("getCalTokens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockImplementation(async (programName: string) => {
        if (programName === MOCK_TOKEN_PROGRAM_ID) {
          return mockTokenCurrency;
        }
        return undefined;
      }),
      getTokensSyncHash: async () => "",
    });
  });

  it("should resolve known program names from CAL and omit unknown ones", async () => {
    const result = await getCalTokens({
      currencyId: mockCurrency.id,
      programNames: [MOCK_TOKEN_PROGRAM_ID, "unknown_token.aleo", MOCK_TOKEN_PROGRAM_ID],
    });

    expect(result.size).toBe(1);
    expect(result.get(MOCK_TOKEN_PROGRAM_ID)).toEqual(mockTokenCurrency);
  });
});

describe("toPrivateBridgeOperation", () => {
  const mockLedgerAccountId =
    "js:2:aleo:aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px::";
  const mockRecipientAddress = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
  const mockSenderAddress = "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr";

  it("should return an IN operation when recipient matches address", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      recipient: mockRecipientAddress,
      sender: mockSenderAddress,
    });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.type).toBe("IN");
    expect(result.senders).toEqual([mockSenderAddress]);
    expect(result.recipients).toEqual([mockRecipientAddress]);
  });

  it("should return an OUT operation when sender matches address", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      sender: mockSenderAddress,
      recipient: mockRecipientAddress,
    });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockSenderAddress);

    expect(result.type).toBe("OUT");
    expect(result.senders).toEqual([mockSenderAddress]);
    expect(result.recipients).toEqual([mockRecipientAddress]);
  });

  it("should encode operation id using ledgerAccountId, transaction_id and type", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      recipient: mockRecipientAddress,
    });
    const expectedId = encodeOperationId(
      mockLedgerAccountId,
      enriched.rawRecord.transaction_id.trim(),
      "IN",
    );

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.id).toBe(expectedId);
    expect(result.accountId).toBe(mockLedgerAccountId);
  });

  it("should trim whitespace from transaction_id when building hash and id", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      rawRecord: { transaction_id: "  tx-with-spaces  " },
      recipient: mockRecipientAddress,
    });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.hash).toBe("tx-with-spaces");
    expect(result.id).toContain("tx-with-spaces");
  });

  it("should set fee from details.fee_value", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      details: { fee_value: 9999 },
    });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.fee).toEqual(new BigNumber(9999));
  });

  it("should set blockHash from details.block_hash", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      details: { block_hash: "ab1testhash", fee_value: 1000 },
    });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.blockHash).toBe("ab1testhash");
  });

  it("should set date from block_timestamp multiplied by 1000", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      rawRecord: { block_timestamp: 1704067200 },
    });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.date).toEqual(new Date(1704067200 * 1000));
  });

  it("should set extra.transactionType to private", () => {
    const enriched = getMockedEnrichedPrivateRecord();

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.extra).toMatchObject({ transactionType: "private" });
  });

  it("should set extra.functionId from rawRecord.function_name", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      rawRecord: { function_name: "transfer_private" },
    });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.extra).toMatchObject({ functionId: "transfer_private" });
  });

  it("should set hasFailed to false", () => {
    const enriched = getMockedEnrichedPrivateRecord();

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.hasFailed).toBe(false);
  });

  it("should set value from enriched.value", () => {
    const enriched = getMockedEnrichedPrivateRecord({ value: new BigNumber(42000000) });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.value).toEqual(new BigNumber(42000000));
  });
});
