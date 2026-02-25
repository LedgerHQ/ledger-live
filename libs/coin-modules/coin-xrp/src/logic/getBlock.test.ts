import { getBlock } from "./getBlock";

const mockGetLedgerByIndex = jest.fn();
jest.mock("../network", () => ({
  getLedgerByIndex: (index: number) => mockGetLedgerByIndex(index),
}));

describe("getBlock", () => {
  afterEach(() => {
    mockGetLedgerByIndex.mockClear();
  });

  it("returns block info with correct height, hash, and time", async () => {
    // Given
    const blockIndex = 12345;
    const mockLedgerHash = "ABC123DEF456";
    const mockParentHash = "PARENT789XYZ";
    const mockCloseTimeIso = "2024-06-01T12:34:56Z";
    mockGetLedgerByIndex.mockResolvedValue({
      ledger_index: blockIndex,
      ledger: {
        ledger_hash: mockLedgerHash,
        parent_hash: mockParentHash,
        close_time_iso: mockCloseTimeIso,
        transactions: [],
      },
    });

    // When
    const result = await getBlock(blockIndex);

    // Then
    expect(mockGetLedgerByIndex).toHaveBeenCalledWith(blockIndex);
    expect(result.info).toEqual({
      height: blockIndex,
      hash: mockLedgerHash,
      parent: {
        height: blockIndex - 1,
        hash: mockParentHash,
      },
      time: new Date(mockCloseTimeIso),
    });
    expect(result.transactions).toEqual([]);
  });

  it("returns early with empty transactions for index <= 0", async () => {
    // When
    const resultZero = await getBlock(0);
    const resultNegative = await getBlock(-1);
    const epoch = new Date(0);

    // Then
    expect(mockGetLedgerByIndex).not.toHaveBeenCalled();
    expect(resultZero).toEqual({ info: { height: 0, hash: "", time: epoch }, transactions: [] });
    expect(resultNegative).toEqual({
      info: { height: -1, hash: "", time: epoch },
      transactions: [],
    });
  });

  it("maps transactions with XRP balance changes correctly (fee excluded from sender)", async () => {
    // Given
    const blockIndex = 12345;
    mockGetLedgerByIndex.mockResolvedValue({
      ledger_index: blockIndex,
      ledger: {
        ledger_hash: "HASH",
        close_time_iso: "2024-06-01T12:34:56Z",
        transactions: [
          {
            hash: "TX_HASH_1",
            tx_json: {
              TransactionType: "Payment",
              Account: "rSender123",
              Fee: "12",
            },
            meta: {
              TransactionResult: "tesSUCCESS",
              AffectedNodes: [
                {
                  ModifiedNode: {
                    LedgerEntryType: "AccountRoot",
                    FinalFields: {
                      Account: "rRecipient456",
                      Balance: "1000000000", // received 1 XRP
                    },
                    PreviousFields: {
                      Balance: "0",
                    },
                  },
                },
                {
                  ModifiedNode: {
                    LedgerEntryType: "AccountRoot",
                    FinalFields: {
                      Account: "rSender123",
                      Balance: "8999999988", // sent 1 XRP (1000000) + 12 drops fee = -1000000012
                    },
                    PreviousFields: {
                      Balance: "10000000000",
                    },
                  },
                },
              ],
            },
            validated: true,
          },
        ],
      },
    });

    // When
    const result = await getBlock(blockIndex);

    // Then
    const tx = result.transactions[0];
    expect(tx.hash).toBe("TX_HASH_1");
    expect(tx.failed).toBe(false);
    expect(tx.fees).toBe(BigInt(12));
    expect(tx.feesPayer).toBe("rSender123");
    expect(tx.operations).toHaveLength(2);

    expect(tx.operations[0]).toEqual({
      type: "transfer",
      address: "rRecipient456",
      asset: {
        type: "native",
        name: "XRP",
      },
      amount: BigInt(1000000000),
    });

    expect(tx.operations[1]).toEqual({
      type: "transfer",
      address: "rSender123",
      asset: {
        type: "native",
        name: "XRP",
      },
      amount: BigInt(-1000000000),
    });
  });

  it("marks transaction as failed when TransactionResult is not tesSUCCESS", async () => {
    // Given
    mockGetLedgerByIndex.mockResolvedValue({
      ledger_index: 12345,
      ledger: {
        ledger_hash: "HASH",
        close_time_iso: "2024-06-01T12:34:56Z",
        transactions: [
          {
            hash: "FAILED_TX",
            tx_json: {
              TransactionType: "Payment",
              Account: "rSender123",
              Fee: "12",
            },
            meta: {
              TransactionResult: "tecINSUFFICIENT_RESERVE",
              AffectedNodes: [],
            },
            validated: true,
          },
        ],
      },
    });

    // When
    const result = await getBlock(12345);

    // Then
    expect(result.transactions[0].failed).toBe(true);
    expect(result.transactions[0].operations).toEqual([]);
  });

  it("handles transactions with empty AffectedNodes gracefully", async () => {
    // Given
    mockGetLedgerByIndex.mockResolvedValue({
      ledger_index: 12345,
      ledger: {
        ledger_hash: "HASH",
        close_time_iso: "2024-06-01T12:34:56Z",
        transactions: [
          {
            hash: "TX_EMPTY_NODES",
            tx_json: {
              TransactionType: "Payment",
              Account: "rSender123",
              Fee: "10",
            },
            meta: {
              TransactionResult: "tesSUCCESS",
              AffectedNodes: [],
            },
            validated: true,
          },
        ],
      },
    });

    // When
    const result = await getBlock(12345);

    // Then
    expect(result.transactions[0].hash).toBe("TX_EMPTY_NODES");
    expect(result.transactions[0].failed).toBe(false);
    expect(result.transactions[0].operations).toEqual([]);
  });

  it("creates 'other' operations for non-AccountRoot ledger entry types", async () => {
    // Given
    mockGetLedgerByIndex.mockResolvedValue({
      ledger_index: 12345,
      ledger: {
        ledger_hash: "HASH",
        close_time_iso: "2024-06-01T12:34:56Z",
        transactions: [
          {
            hash: "TX_OTHER_TYPES",
            tx_json: {
              TransactionType: "Payment",
              Account: "rSender123",
              Fee: "10",
            },
            meta: {
              TransactionResult: "tesSUCCESS",
              AffectedNodes: [
                {
                  ModifiedNode: {
                    LedgerEntryType: "RippleState",
                    FinalFields: { Balance: "100" },
                    PreviousFields: { Balance: "0" },
                  },
                },
                {
                  ModifiedNode: {
                    LedgerEntryType: "DirectoryNode",
                    FinalFields: {},
                    PreviousFields: {},
                  },
                },
              ],
            },
            validated: true,
          },
        ],
      },
    });

    // When
    const result = await getBlock(12345);

    // Then
    expect(result.transactions[0].operations).toHaveLength(2);
    expect(result.transactions[0].operations[0].type).toBe("other");
    expect(result.transactions[0].operations[1].type).toBe("other");
  });

  it("ignores DeletedNode entries for AccountRoot (no transfer created)", async () => {
    // Given
    mockGetLedgerByIndex.mockResolvedValue({
      ledger_index: 12345,
      ledger: {
        ledger_hash: "HASH",
        close_time_iso: "2024-06-01T12:34:56Z",
        transactions: [
          {
            hash: "TX_DELETED",
            tx_json: {
              TransactionType: "Payment",
              Account: "rSender123",
              Fee: "10",
            },
            meta: {
              TransactionResult: "tesSUCCESS",
              AffectedNodes: [
                {
                  DeletedNode: {
                    LedgerEntryType: "AccountRoot",
                    FinalFields: {
                      Account: "rDeleted",
                      Balance: "0",
                    },
                  },
                },
              ],
            },
            validated: true,
          },
        ],
      },
    });

    // When
    const result = await getBlock(12345);

    // Then
    expect(result.transactions[0].operations).toEqual([]);
  });

  it("ignores zero balance changes", async () => {
    // Given
    mockGetLedgerByIndex.mockResolvedValue({
      ledger_index: 12345,
      ledger: {
        ledger_hash: "HASH",
        close_time_iso: "2024-06-01T12:34:56Z",
        transactions: [
          {
            hash: "TX_NO_CHANGE",
            tx_json: {
              TransactionType: "Payment",
              Account: "rSender123",
              Fee: "10",
            },
            meta: {
              TransactionResult: "tesSUCCESS",
              AffectedNodes: [
                {
                  ModifiedNode: {
                    LedgerEntryType: "AccountRoot",
                    FinalFields: {
                      Account: "rAccount",
                      Balance: "1000000",
                    },
                    PreviousFields: {
                      Balance: "1000000",
                    },
                  },
                },
              ],
            },
            validated: true,
          },
        ],
      },
    });

    // When
    const result = await getBlock(12345);

    // Then
    expect(result.transactions[0].operations).toEqual([]);
  });

  it("handles CreatedNode for new accounts", async () => {
    // Given
    mockGetLedgerByIndex.mockResolvedValue({
      ledger_index: 12345,
      ledger: {
        ledger_hash: "HASH",
        close_time_iso: "2024-06-01T12:34:56Z",
        transactions: [
          {
            hash: "TX_NEW_ACCOUNT",
            tx_json: {
              TransactionType: "Payment",
              Account: "rFunder",
              Fee: "10",
            },
            meta: {
              TransactionResult: "tesSUCCESS",
              AffectedNodes: [
                {
                  CreatedNode: {
                    LedgerEntryType: "AccountRoot",
                    NewFields: {
                      Account: "rNewAccount",
                      Balance: "20000000",
                    },
                  },
                },
              ],
            },
            validated: true,
          },
        ],
      },
    });

    // When
    const result = await getBlock(12345);

    // Then
    expect(result.transactions[0].operations).toHaveLength(1);
    expect(result.transactions[0].operations[0]).toEqual({
      type: "transfer",
      address: "rNewAccount",
      asset: {
        type: "native",
        name: "XRP",
      },
      amount: BigInt(20000000),
    });
  });

  it("includes non-Payment transaction types (AccountSet, TrustSet, OfferCreate)", async () => {
    // Given
    mockGetLedgerByIndex.mockResolvedValue({
      ledger_index: 12345,
      ledger: {
        ledger_hash: "HASH",
        close_time_iso: "2024-06-01T12:34:56Z",
        transactions: [
          {
            hash: "TX_ACCOUNT_SET",
            tx_json: {
              TransactionType: "AccountSet",
              Account: "rAccountOwner",
              Fee: "15",
            },
            meta: {
              TransactionResult: "tesSUCCESS",
              AffectedNodes: [],
            },
            validated: true,
          },
          {
            hash: "TX_TRUST_SET",
            tx_json: {
              TransactionType: "TrustSet",
              Account: "rTrustLineOwner",
              Fee: "12",
            },
            meta: {
              TransactionResult: "tesSUCCESS",
              AffectedNodes: [
                {
                  ModifiedNode: {
                    LedgerEntryType: "RippleState",
                    FinalFields: { Balance: "1000" },
                    PreviousFields: { Balance: "0" },
                  },
                },
              ],
            },
            validated: true,
          },
          {
            hash: "TX_OFFER_CREATE",
            tx_json: {
              TransactionType: "OfferCreate",
              Account: "rTrader",
              Fee: "10",
            },
            meta: {
              TransactionResult: "tesSUCCESS",
              AffectedNodes: [],
            },
            validated: true,
          },
        ],
      },
    });

    // When
    const result = await getBlock(12345);

    // Then
    expect(result.transactions).toHaveLength(3);

    expect(result.transactions[0]).toMatchObject({
      hash: "TX_ACCOUNT_SET",
      fees: 15n,
      feesPayer: "rAccountOwner",
      operations: [],
    });

    expect(result.transactions[1]).toMatchObject({
      hash: "TX_TRUST_SET",
      fees: 12n,
      feesPayer: "rTrustLineOwner",
      operations: [{ type: "other" }],
    });

    expect(result.transactions[2]).toMatchObject({
      hash: "TX_OFFER_CREATE",
      fees: 10n,
      feesPayer: "rTrader",
      operations: [],
    });
  });

  it("creates 'other' operations for CreatedNode with non-AccountRoot LedgerEntryType", async () => {
    // Given
    mockGetLedgerByIndex.mockResolvedValue({
      ledger_index: 12345,
      ledger: {
        ledger_hash: "HASH",
        close_time_iso: "2024-06-01T12:34:56Z",
        transactions: [
          {
            hash: "TX_CREATED_OTHER",
            tx_json: {
              TransactionType: "TrustSet",
              Account: "rSender123",
              Fee: "10",
            },
            meta: {
              TransactionResult: "tesSUCCESS",
              AffectedNodes: [
                {
                  CreatedNode: {
                    LedgerEntryType: "RippleState",
                    NewFields: { Balance: "1000" },
                  },
                },
                {
                  CreatedNode: {
                    LedgerEntryType: "DirectoryNode",
                    NewFields: {},
                  },
                },
              ],
            },
            validated: true,
          },
        ],
      },
    });

    // When
    const result = await getBlock(12345);

    // Then
    expect(result.transactions[0].operations).toHaveLength(2);
    expect(result.transactions[0].operations[0].type).toBe("other");
    expect(result.transactions[0].operations[1].type).toBe("other");
  });

  it("creates 'other' operations for DeletedNode with non-AccountRoot LedgerEntryType", async () => {
    // Given
    mockGetLedgerByIndex.mockResolvedValue({
      ledger_index: 12345,
      ledger: {
        ledger_hash: "HASH",
        close_time_iso: "2024-06-01T12:34:56Z",
        transactions: [
          {
            hash: "TX_DELETED_OTHER",
            tx_json: {
              TransactionType: "OfferCancel",
              Account: "rTrader",
              Fee: "10",
            },
            meta: {
              TransactionResult: "tesSUCCESS",
              AffectedNodes: [
                {
                  DeletedNode: {
                    LedgerEntryType: "Offer",
                    FinalFields: { TakerPays: "1000", TakerGets: "500" },
                  },
                },
                {
                  DeletedNode: {
                    LedgerEntryType: "DirectoryNode",
                    FinalFields: {},
                  },
                },
              ],
            },
            validated: true,
          },
        ],
      },
    });

    // When
    const result = await getBlock(12345);

    // Then
    expect(result.transactions[0].operations).toHaveLength(2);
    expect(result.transactions[0].operations[0].type).toBe("other");
    expect(result.transactions[0].operations[1].type).toBe("other");
  });

  it("returns empty operations for ModifiedNode AccountRoot with missing fields", async () => {
    // Given - test various missing field scenarios
    mockGetLedgerByIndex.mockResolvedValue({
      ledger_index: 12345,
      ledger: {
        ledger_hash: "HASH",
        close_time_iso: "2024-06-01T12:34:56Z",
        transactions: [
          {
            hash: "TX_MISSING_FIELDS",
            tx_json: {
              TransactionType: "Payment",
              Account: "rSender123",
              Fee: "10",
            },
            meta: {
              TransactionResult: "tesSUCCESS",
              AffectedNodes: [
                {
                  // Missing PreviousFields.Balance
                  ModifiedNode: {
                    LedgerEntryType: "AccountRoot",
                    FinalFields: {
                      Account: "rAccount1",
                      Balance: "1000000",
                    },
                    PreviousFields: {},
                  },
                },
                {
                  // Missing FinalFields.Balance
                  ModifiedNode: {
                    LedgerEntryType: "AccountRoot",
                    FinalFields: {
                      Account: "rAccount2",
                    },
                    PreviousFields: {
                      Balance: "500000",
                    },
                  },
                },
                {
                  // Missing FinalFields.Account
                  ModifiedNode: {
                    LedgerEntryType: "AccountRoot",
                    FinalFields: {
                      Balance: "1000000",
                    },
                    PreviousFields: {
                      Balance: "500000",
                    },
                  },
                },
              ],
            },
            validated: true,
          },
        ],
      },
    });

    // When
    const result = await getBlock(12345);

    // Then - all should return empty due to missing required fields
    expect(result.transactions[0].operations).toEqual([]);
  });

  it("returns empty operations for CreatedNode AccountRoot with missing fields", async () => {
    // Given - test missing NewFields.Balance and NewFields.Account
    mockGetLedgerByIndex.mockResolvedValue({
      ledger_index: 12345,
      ledger: {
        ledger_hash: "HASH",
        close_time_iso: "2024-06-01T12:34:56Z",
        transactions: [
          {
            hash: "TX_CREATED_MISSING",
            tx_json: {
              TransactionType: "Payment",
              Account: "rFunder",
              Fee: "10",
            },
            meta: {
              TransactionResult: "tesSUCCESS",
              AffectedNodes: [
                {
                  // Missing NewFields.Balance
                  CreatedNode: {
                    LedgerEntryType: "AccountRoot",
                    NewFields: {
                      Account: "rNewAccount1",
                    },
                  },
                },
                {
                  // Missing NewFields.Account
                  CreatedNode: {
                    LedgerEntryType: "AccountRoot",
                    NewFields: {
                      Balance: "20000000",
                    },
                  },
                },
              ],
            },
            validated: true,
          },
        ],
      },
    });

    // When
    const result = await getBlock(12345);

    // Then - all should return empty due to missing required fields
    expect(result.transactions[0].operations).toEqual([]);
  });

  it("handles undefined AffectedNodes gracefully", async () => {
    // Given - AffectedNodes is undefined (not just empty array)
    mockGetLedgerByIndex.mockResolvedValue({
      ledger_index: 12345,
      ledger: {
        ledger_hash: "HASH",
        close_time_iso: "2024-06-01T12:34:56Z",
        transactions: [
          {
            hash: "TX_UNDEFINED_NODES",
            tx_json: {
              TransactionType: "Payment",
              Account: "rSender123",
              Fee: "10",
            },
            meta: {
              TransactionResult: "tesSUCCESS",
              // AffectedNodes is undefined
            },
            validated: true,
          },
        ],
      },
    });

    // When
    const result = await getBlock(12345);

    // Then - should handle gracefully with empty operations
    expect(result.transactions[0].hash).toBe("TX_UNDEFINED_NODES");
    expect(result.transactions[0].failed).toBe(false);
    expect(result.transactions[0].operations).toEqual([]);
  });
});
