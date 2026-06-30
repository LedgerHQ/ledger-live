import type {
  APIBlock,
  APIDelegationType,
  APIRevealType,
  APIStakingType,
  APITokenTransfer,
  APITransactionType,
} from "../network/types";
import { listOperations } from "./listOperations";

const mockGetAccountOperations = jest.fn();
const mockGetAccountTokenTransfers = jest.fn();
const mockGetBlockHashesByLevels = jest.fn();

jest.mock("../network", () => ({
  tzkt: {
    getAccountOperations: async (address: string, options: unknown) =>
      mockGetAccountOperations(address, options),
    getAccountTokenTransfers: async (address: string, options: unknown) =>
      mockGetAccountTokenTransfers(address, options),
    getBlockHashesByLevels: async (levels: number[]) => mockGetBlockHashesByLevels(levels),
  },
}));

const options: {
  sort: "Ascending" | "Descending";
  minHeight: number;
  limit?: number;
} = {
  sort: "Ascending",
  minHeight: 0,
};

describe("listOperations", () => {
  afterEach(() => {
    mockGetAccountOperations.mockReset();
    mockGetAccountTokenTransfers.mockReset();
    mockGetBlockHashesByLevels.mockReset();
  });

  beforeEach(() => {
    mockGetAccountOperations.mockResolvedValue([]);
    mockGetAccountTokenTransfers.mockResolvedValue([]);
  });

  it("forwards level.lt from cursor on both streams when sort is Descending", async () => {
    await listOperations("tz1PaginationAddr", {
      ...options,
      sort: "Descending",
      token: JSON.stringify({ lastLevel: 5_000_000 }),
    });

    expect(mockGetAccountOperations).toHaveBeenCalledWith(
      "tz1PaginationAddr",
      expect.objectContaining({
        "level.lt": 5_000_000,
        sort: "Descending",
        "level.ge": options.minHeight,
      }),
    );
    expect(mockGetAccountTokenTransfers).toHaveBeenCalledWith(
      "tz1PaginationAddr",
      expect.objectContaining({
        "level.lt": 5_000_000,
        sort: "Descending",
        "level.ge": options.minHeight,
      }),
    );
  });

  it("forwards level.ge continuation when sort is Ascending and cursor has lastLevel", async () => {
    await listOperations("tz1AscPage2", {
      ...options,
      sort: "Ascending",
      minHeight: 0,
      token: JSON.stringify({ lastLevel: 100 }),
    });

    expect(mockGetAccountOperations).toHaveBeenCalledWith(
      "tz1AscPage2",
      expect.objectContaining({
        "level.ge": 101,
        sort: "Ascending",
      }),
    );
    expect(mockGetAccountTokenTransfers).toHaveBeenCalledWith(
      "tz1AscPage2",
      expect.objectContaining({
        "level.ge": 101,
        sort: "Ascending",
      }),
    );
  });

  it("ignores legacy id-based pagination cursor (fresh level window)", async () => {
    await listOperations("tz1Legacy", {
      ...options,
      token: JSON.stringify({ nativeLastId: 111, tokenLastId: 222 }),
    });

    const [, nativeOpts] = mockGetAccountOperations.mock.calls[0];
    const [, tokenOpts] = mockGetAccountTokenTransfers.mock.calls[0];
    expect(nativeOpts).not.toHaveProperty("level.lt");
    expect(nativeOpts).not.toHaveProperty("lastId");
    expect(tokenOpts).not.toHaveProperty("level.lt");
    expect(tokenOpts).not.toHaveProperty("lastId");
  });

  it("ignores invalid pagination cursor JSON", async () => {
    await listOperations("tz1BadCursor", {
      ...options,
      token: "not-valid-json{",
    });

    const [, nativeOpts] = mockGetAccountOperations.mock.calls[0];
    const [, tokenOpts] = mockGetAccountTokenTransfers.mock.calls[0];
    expect(nativeOpts).not.toHaveProperty("level.lt");
    expect(tokenOpts).not.toHaveProperty("level.lt");
  });

  it("should return no operations", async () => {
    // Given
    // When
    const [results, token] = await listOperations("any address", options);
    // Then
    expect(results).toEqual([]);
    expect(token).toEqual("");
  });

  const someDestinationAddress = "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D";
  const someSenderAddress = "tz2CVMDVA16dD9A7kpWym2ptGDhs5zUhwWXr";
  const someHash = "ooY7YKLgWE8mrELbsDLEtPsxFNaLdqRbbRR1b1FXDA6DwasAFe4";
  const commonTx = {
    counter: 65214462,
    hash: someHash,
    gasLimit: 4,
    storageLimit: 5,
    level: 2702551,
    block: "BMJ1ZQ6",
    timestamp: "2022-09-12T01:36:59Z",
    sender: {
      address: someSenderAddress,
    },
  };
  const delegate: APIDelegationType = {
    ...commonTx,
    type: "delegation",
    id: 111,
    amount: 724846,
    prevDelegate: {
      address: someDestinationAddress,
    },
    newDelegate: null,
    storageFee: 1,
    bakerFee: 2,
    allocationFee: 3,
  };

  const undelegate: APIDelegationType = {
    ...delegate,
    id: 222,
    prevDelegate: null,
    newDelegate: { address: someDestinationAddress },
  };

  const transfer: APITransactionType = {
    ...delegate,
    id: 333,
    initiator: null,
    type: "transaction",
    status: "applied",
    target: { address: someDestinationAddress },
  };

  const reveal: APIRevealType = {
    ...commonTx,
    id: 444,
    type: "reveal",
    bakerFee: 4700,
    status: "applied",
  };

  it.each([
    ["undelegate", undelegate, "DELEGATE", "DELEGATE", 0n],
    ["delegate", delegate, "UNDELEGATE", "UNDELEGATE", 0n],
    ["transfer", transfer, "OUT", undefined, 724846n],
  ])(
    "should return %s operation with proper recipient list",
    async (_label, operation, expectedType, expectedLedgerOpType, expectedAmount) => {
      // Given
      mockGetAccountOperations.mockResolvedValue([operation]);
      // When — use someSenderAddress so transaction ops pass the sender/target filter
      const [results] = await listOperations(someSenderAddress, options);
      // Then
      expect(results).toEqual([
        {
          id: `${operation.hash}-${operation.id}`,
          asset: { type: "native" },
          details: {
            counter: operation.counter,
            gasLimit: operation.gasLimit,
            storageLimit: operation.storageLimit,
            ledgerOpType: expectedLedgerOpType,
          },
          senders: [someSenderAddress],
          recipients: [someDestinationAddress],
          tx: {
            block: {
              hash: operation.block,
              height: operation.level,
              time: new Date(operation.timestamp),
            },
            date: new Date(operation.timestamp),
            hash: operation.hash,
            failed: false,
            fees: BigInt(
              (operation.allocationFee ?? 0) +
                (operation.bakerFee ?? 0) +
                (operation.storageFee ?? 0),
            ),
            feesPayer: someSenderAddress,
          },
          type: expectedType,
          value: expectedAmount,
        },
      ]);
    },
  );

  it.each([
    ["undelegate", undelegate],
    ["delegate", delegate],
    ["transfer", transfer],
    ["reveal", reveal],
  ])(
    "should return %s operation with pagination cursor lastLevel when page is full",
    async (_label, operation) => {
      // Given
      mockGetAccountOperations.mockResolvedValue([operation]);
      // When
      const [results, token] = await listOperations(someSenderAddress, {
        ...options,
        limit: 1,
        sort: "Descending",
      });
      // Then
      expect(results.length).toEqual(1);
      expect(JSON.parse(token)).toEqual(
        expect.objectContaining({
          lastLevel: operation.level,
          nativeLastId: operation.id,
        }),
      );
    },
  );

  it.each([
    ["undelegate", undelegate, "DELEGATE"],
    ["delegate", delegate, "UNDELEGATE"],
    ["transfer", transfer, undefined],
    ["reveal", reveal, "REVEAL"],
  ])(
    "should return %s operation with expected details",
    async (_label, operation, expectedLedgerOpType) => {
      // Given
      mockGetAccountOperations.mockResolvedValue([operation]);
      // When
      const [results, _] = await listOperations(someSenderAddress, options);
      // Then
      expect(results.length).toEqual(1);
      expect(results[0].details).toEqual({
        counter: 65214462,
        gasLimit: 4,
        storageLimit: 5,
        ledgerOpType: expectedLedgerOpType,
      });
    },
  );

  it.each([
    { ...undelegate, newDelegate: null, prevDelegate: null },
    { ...transfer, target: null },
  ])("should return empty recipient list when no target can be found", async operation => {
    // Given
    mockGetAccountOperations.mockResolvedValue([operation]);
    // When
    const [results, token] = await listOperations(someSenderAddress, options);
    // Then
    expect(results.length).toEqual(1);
    expect(results[0].recipients).toEqual([]);
    expect(token).toEqual("");
  });

  it.each([
    ["undelegate", { ...undelegate, storageFee: 1, bakerFee: 2, allocationFee: 3 }],
    ["delegate", { ...delegate, storageFee: 1, bakerFee: 2, allocationFee: 3 }],
    ["transfer", { ...transfer, storageFee: 1, bakerFee: 2, allocationFee: 3 }],
  ])("should compute the fees properly for %s operation", async (_label, operation) => {
    // Given
    mockGetAccountOperations.mockResolvedValue([operation]);
    // When
    const [results, _] = await listOperations(someSenderAddress, options);
    // Then
    expect(results.length).toEqual(1);
    expect(results[0].tx.fees).toEqual(BigInt(6));
  });

  it("should return empty sender list when no sender can be found", async () => {
    // Given
    const operation = { ...undelegate, sender: null };
    mockGetAccountOperations.mockResolvedValue([operation]);
    // When
    const [results, token] = await listOperations("any address", options);
    // Then
    expect(results.length).toEqual(1);
    expect(results[0].senders).toEqual([]);
    expect(token).toEqual("");
  });

  it("should order the results in descending order even if the sort option is set to ascending", async () => {
    const op1 = { ...undelegate, level: "1", timestamp: "2022-09-12T01:00:00Z" };
    const op2 = { ...undelegate, level: "2", timestamp: "2022-09-12T01:01:00Z" };
    mockGetAccountOperations.mockResolvedValue([op1, op2]);
    const [results, _] = await listOperations("any address", options);
    expect(results.map(op => op.tx.block.height)).toEqual(["2", "1"]);
  });

  describe("feesPayer", () => {
    it("uses initiator as feesPayer when present (internal transaction)", async () => {
      const initiatorAddress = "tz1NKVAxzJusWgKewn4LEViPSQVRE5Kg6XFV";
      const contractAddress = "KT1WPEis2WhAc2FciM2tZVn8qe6pCBe9HkDp";
      const internalTx: APITransactionType = {
        ...transfer,
        id: 555,
        initiator: { address: initiatorAddress },
        sender: { address: contractAddress },
        target: { address: someDestinationAddress },
      };
      mockGetAccountOperations.mockResolvedValue([internalTx]);
      const [results] = await listOperations(someDestinationAddress, options);
      expect(results[0]).toMatchObject({
        tx: {
          feesPayer: initiatorAddress,
        },
        senders: [contractAddress],
        recipients: [someDestinationAddress],
      });
    });

    it("omits feesPayer when both sender and initiator are null", async () => {
      const txNoSender: APITransactionType = {
        ...transfer,
        id: 557,
        initiator: null,
        sender: null,
      };
      mockGetAccountOperations.mockResolvedValue([txNoSender]);
      const [results] = await listOperations(someDestinationAddress, options);
      expect(results[0].tx.feesPayer).toBeUndefined();
      expect(results[0]).toMatchObject({
        senders: [],
        recipients: [someDestinationAddress],
      });
    });

    it("uses sender as feesPayer for delegation (no initiator field)", async () => {
      mockGetAccountOperations.mockResolvedValue([delegate]);
      const [results] = await listOperations("any address", options);
      expect(results[0]).toMatchObject({
        tx: {
          feesPayer: someSenderAddress,
        },
        senders: [someSenderAddress],
        recipients: [someDestinationAddress],
      });
    });

    it("uses sender as feesPayer for reveal", async () => {
      mockGetAccountOperations.mockResolvedValue([reveal]);
      const [results] = await listOperations("any address", options);
      expect(results[0]).toMatchObject({
        tx: {
          feesPayer: someSenderAddress,
        },
        senders: [someSenderAddress],
        recipients: [],
      });
    });
  });

  it("filters out internal sub-transactions where account is neither sender nor target", async () => {
    const contractAddress = "KT1WPEis2WhAc2FciM2tZVn8qe6pCBe9HkDp";
    const thirdPartyAddress = "tz1Pci9FqMTqADRXqgD3ZDsdfEFcPqMTqA8D";

    // Top-level: user sends to contract
    const topLevelTx: APITransactionType = {
      ...transfer,
      id: 700,
      amount: 100000,
      target: { address: contractAddress },
    };

    // Internal: contract forwards to a third party (neither sender nor target is our account)
    const internalTx: APITransactionType = {
      ...transfer,
      id: 701,
      amount: 90000,
      initiator: { address: someSenderAddress },
      sender: { address: contractAddress },
      target: { address: thirdPartyAddress },
    };

    mockGetAccountOperations.mockResolvedValue([topLevelTx, internalTx]);
    const [results] = await listOperations(someSenderAddress, options);

    // Only the top-level tx should be kept; the internal sub-tx is filtered out
    expect(results).toHaveLength(1);
    expect(results[0].senders).toEqual([someSenderAddress]);
    expect(results[0].recipients).toEqual([contractAddress]);
    expect(results[0].value).toEqual(100000n);
  });

  it("accumulates fees from filtered internal sub-txs onto the parent operation", async () => {
    const contractAddress = "KT1WPEis2WhAc2FciM2tZVn8qe6pCBe9HkDp";
    const thirdPartyAddress = "tz1Pci9FqMTqADRXqgD3ZDsdfEFcPqMTqA8D";

    // Top-level: user sends to contract (bakerFee = 4749)
    const topLevelTx: APITransactionType = {
      ...transfer,
      id: 800,
      amount: 1000,
      bakerFee: 4749,
      storageFee: 0,
      allocationFee: 0,
      target: { address: contractAddress },
    };

    // Internal sub-tx 1: contract calls another contract, storage charged to initiator
    const internalTx1: APITransactionType = {
      ...transfer,
      id: 801,
      amount: 0,
      bakerFee: 0,
      storageFee: 17000,
      allocationFee: 0,
      initiator: { address: someSenderAddress },
      sender: { address: contractAddress },
      target: { address: thirdPartyAddress },
    };

    // Internal sub-tx 2: another internal call with storage fee
    const internalTx2: APITransactionType = {
      ...transfer,
      id: 802,
      amount: 0,
      bakerFee: 0,
      storageFee: 500,
      allocationFee: 0,
      initiator: { address: someSenderAddress },
      sender: { address: contractAddress },
      target: { address: thirdPartyAddress },
    };

    mockGetAccountOperations.mockResolvedValue([topLevelTx, internalTx1, internalTx2]);
    const [results] = await listOperations(someSenderAddress, options);

    // Only top-level tx kept, but fees include internal sub-tx storage costs
    expect(results).toHaveLength(1);
    expect(results[0].tx.fees).toEqual(4749n + 17000n + 500n);
  });

  it("FA2 token transfers (tokenId 0), attributes fees from parent tx", async () => {
    const fa2: APITokenTransfer & { hash: string } = {
      id: 9001,
      level: 100,
      timestamp: "2023-06-01T12:00:00Z",
      token: {
        id: 1,
        contract: { address: "KT1TokenContract" },
        tokenId: "0",
        standard: "fa2",
        metadata: { name: "Tok", symbol: "TOK", decimals: "6" },
      },
      from: { address: someSenderAddress },
      to: { address: someDestinationAddress },
      amount: "1000000",
      transactionId: transfer.id,
      hash: someHash,
    };
    const appliedTransfer = { ...transfer, status: "applied" as const, level: 100 };
    mockGetAccountOperations.mockResolvedValue([appliedTransfer]);
    mockGetAccountTokenTransfers.mockResolvedValue([fa2]);
    const [results, next] = await listOperations(someDestinationAddress, {
      ...options,
      limit: 1,
      sort: "Descending",
    });
    const tokenOp = results.find(o => o.asset.type === "fa2");

    expect(JSON.parse(next)).toEqual(
      expect.objectContaining({
        lastLevel: 100,
        nativeLastId: transfer.id,
        tokenLastId: 9001,
      }),
    );

    expect(tokenOp).toMatchObject({
      type: "IN",
      value: 1_000_000n,
      asset: {
        type: "fa2",
        assetReference: "KT1TokenContract:0",
        assetOwner: someDestinationAddress,
        unit: { magnitude: 6, name: "Tok", code: "TOK" },
      },
      tx: {
        hash: someHash,
        fees: 0n,
        feesPayer: someSenderAddress,
        failed: false,
        block: { hash: "BMJ1ZQ6", height: 100, time: new Date(fa2.timestamp) },
      },
      details: {
        ledgerOpType: "IN",
        assetAmount: "1000000",
        assetSenders: [someSenderAddress],
        assetRecipients: [someDestinationAddress],
        parentSenders: [someSenderAddress],
        parentRecipients: [someDestinationAddress],
      },
    });
    expect(results.length).toBe(2);
  });

  it("FA2 uses transfer.block as tx.block.hash even when a parent native transaction is joined", async () => {
    const fa2WithBlock: APITokenTransfer & { hash: string; block: string } = {
      id: 9002,
      level: 100,
      timestamp: "2023-06-01T12:00:00Z",
      token: {
        id: 1,
        contract: { address: "KT1TokenContract" },
        tokenId: "0",
        standard: "fa2",
        metadata: { decimals: "6" },
      },
      from: { address: someSenderAddress },
      to: { address: someDestinationAddress },
      amount: "1",
      transactionId: transfer.id,
      hash: someHash,
      block: "BLK_FROM_TRANSFER",
    };
    const appliedTransfer = {
      ...transfer,
      status: "applied" as const,
      block: "BLK_FROM_PARENT",
    };
    mockGetAccountOperations.mockResolvedValue([appliedTransfer]);
    mockGetAccountTokenTransfers.mockResolvedValue([fa2WithBlock]);
    const [results] = await listOperations(someDestinationAddress, options);
    const tokenOp = results.find(o => o.asset.type === "fa2");

    expect(tokenOp!.tx.block.hash).toBe("BLK_FROM_TRANSFER");
  });

  it("drops failed incoming native transactions (target is the listed account)", async () => {
    const failedIn: APITransactionType = {
      ...transfer,
      id: 6001,
      status: "failed",
      sender: { address: someSenderAddress },
      target: { address: someDestinationAddress },
    };
    mockGetAccountOperations.mockResolvedValue([failedIn]);
    const [results] = await listOperations(someDestinationAddress, options);
    expect(results).toEqual([]);
  });

  it("keeps failed outgoing native transactions", async () => {
    const failedOut: APITransactionType = {
      ...transfer,
      id: 6002,
      status: "failed",
      sender: { address: someSenderAddress },
      target: { address: someDestinationAddress },
    };
    mockGetAccountOperations.mockResolvedValue([failedOut]);
    const [results] = await listOperations(someSenderAddress, options);
    expect(results).toHaveLength(1);
    const out = results[0];
    expect(out!.tx.failed).toBe(true);
    expect(out!.type).toBe("OUT");
  });

  it("normalizes applied transfer as IN when the account is only the recipient", async () => {
    const incoming: APITransactionType = {
      ...transfer,
      id: 7001,
      status: "applied",
      sender: { address: someSenderAddress },
      target: { address: someDestinationAddress },
    };
    mockGetAccountOperations.mockResolvedValue([incoming]);
    const [results] = await listOperations(someDestinationAddress, options);
    expect(results).toHaveLength(1);
    const row = results[0];
    expect(row!.type).toBe("IN");
    expect(row!.details?.ledgerOpType).toBeUndefined();
  });

  it("normalizes self-transfer as FEES with ledgerOpType FEES", async () => {
    const selfTx: APITransactionType = {
      ...transfer,
      id: 7002,
      status: "applied",
      amount: 100,
      sender: { address: someSenderAddress },
      target: { address: someSenderAddress },
    };
    mockGetAccountOperations.mockResolvedValue([selfTx]);
    const [results] = await listOperations(someSenderAddress, options);
    expect(results).toHaveLength(1);
    const selfRow = results[0];
    expect(selfRow!.type).toBe("FEES");
    expect(selfRow!.details?.ledgerOpType).toBe("FEES");
  });

  it("normalizes zero-amount transfer as FEES", async () => {
    const zeroTx: APITransactionType = {
      ...transfer,
      id: 7003,
      status: "applied",
      amount: 0,
      sender: { address: someSenderAddress },
      target: { address: someDestinationAddress },
    };
    mockGetAccountOperations.mockResolvedValue([zeroTx]);
    const [results] = await listOperations(someSenderAddress, options);
    expect(results).toHaveLength(1);
    const zeroRow = results[0];
    expect(zeroRow!.type).toBe("FEES");
    expect(zeroRow!.details?.ledgerOpType).toBe("FEES");
  });

  it("applies limit to native operations returned from the explorer", async () => {
    const op1 = { ...undelegate, id: 8001 };
    const op2 = { ...undelegate, id: 8002 };
    const op3 = { ...undelegate, id: 8003 };
    mockGetAccountOperations.mockResolvedValue([op1, op2, op3]);
    const [results] = await listOperations("any address", { ...options, limit: 2 });
    expect(results).toHaveLength(2);
  });

  it("FA2 token transfer as OUT when the account is only the sender", async () => {
    const fa2Out: APITokenTransfer & { hash: string } = {
      id: 9101,
      level: 101,
      timestamp: "2023-06-01T13:00:00Z",
      token: {
        id: 2,
        contract: { address: "KT1Out" },
        tokenId: "0",
        standard: "fa2",
        metadata: { decimals: "0" },
      },
      from: { address: someSenderAddress },
      to: { address: someDestinationAddress },
      amount: "500",
      transactionId: transfer.id,
      hash: "ooTokenOutHash",
    };
    mockGetAccountOperations.mockResolvedValue([{ ...transfer, status: "applied" as const }]);
    mockGetAccountTokenTransfers.mockResolvedValue([fa2Out]);
    const [results] = await listOperations(someSenderAddress, options);
    const tokenOut = results.find(o => o.asset.type === "fa2");
    expect(tokenOut!.type).toBe("OUT");
    expect(tokenOut!.details?.ledgerOpType).toBe("OUT");
  });

  it("FA2 self-transfer (same from and to as account) is typed FEES", async () => {
    const fa2Self: APITokenTransfer & { hash: string } = {
      id: 9102,
      level: 102,
      timestamp: "2023-06-01T14:00:00Z",
      token: {
        id: 3,
        contract: { address: "KT1Self" },
        tokenId: "0",
        standard: "fa2",
      },
      from: { address: someSenderAddress },
      to: { address: someSenderAddress },
      amount: "1",
      hash: "ooTokenSelfHash",
    };
    mockGetAccountOperations.mockResolvedValue([]);
    mockGetAccountTokenTransfers.mockResolvedValue([fa2Self]);
    const [results] = await listOperations(someSenderAddress, options);
    const tokenSelf = results.find(o => o.asset.type === "fa2");
    expect(tokenSelf!.type).toBe("FEES");
    expect(tokenSelf!.details?.ledgerOpType).toBe("FEES");
  });

  it("FA2 transfer without parent transaction omits fees and falls back to transfer.block hash", async () => {
    const fa2Orphan: APITokenTransfer & { hash: string; block: string } = {
      id: 9103,
      level: 103,
      timestamp: "2023-06-01T15:00:00Z",
      token: {
        id: 4,
        contract: { address: "KT1Orphan" },
        tokenId: "0",
        standard: "fa2",
      },
      from: { address: someSenderAddress },
      to: { address: someDestinationAddress },
      amount: "10",
      hash: "ooOrphanHash",
      block: "BLK_ORPHAN",
    };
    mockGetAccountOperations.mockResolvedValue([]);
    mockGetAccountTokenTransfers.mockResolvedValue([fa2Orphan]);
    const [results] = await listOperations(someDestinationAddress, options);
    const orphan = results.find(o => o.asset.type === "fa2");
    expect(orphan!.tx.fees).toBe(0n);
    expect(orphan!.tx.feesPayer).toBeUndefined();
    expect(orphan!.tx.block.hash).toBe("BLK_ORPHAN");
    expect(orphan!.tx.failed).toBe(false);
  });

  it("FA2 transfer without parent and without transfer.block falls back to empty block hash", async () => {
    const fa2NoBlock: APITokenTransfer & { hash: string } = {
      id: 9104,
      level: 104,
      timestamp: "2023-06-01T16:00:00Z",
      token: {
        id: 5,
        contract: { address: "KT1NoBlock" },
        tokenId: "0",
        standard: "fa2",
      },
      from: { address: someSenderAddress },
      to: { address: someDestinationAddress },
      amount: "10",
      hash: "ooNoBlockHash",
    };
    mockGetAccountOperations.mockResolvedValue([]);
    mockGetAccountTokenTransfers.mockResolvedValue([fa2NoBlock]);
    const [results] = await listOperations(someDestinationAddress, options);
    const noBlock = results.find(o => o.asset.type === "fa2");
    expect(noBlock!.tx.block.hash).toBe("");
  });

  it("trims partial bottom block on full page (descending) so levels are not split across pages", async () => {
    const opHigh: APITransactionType = {
      ...transfer,
      id: 80010,
      level: 2000,
      status: "applied" as const,
    };
    const opLow: APITransactionType = {
      ...transfer,
      id: 80011,
      level: 1999,
      status: "applied" as const,
    };
    mockGetAccountOperations.mockResolvedValue([opHigh, opLow]);
    mockGetAccountTokenTransfers.mockResolvedValue([]);
    const [results] = await listOperations(someSenderAddress, {
      sort: "Descending",
      minHeight: 0,
      limit: 2,
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.tx.block.height).toBe(2000);
  });

  it("emits nativeLastId on full single-level native page and forwards lastId on next request", async () => {
    const op1 = { ...transfer, id: 900_001, level: 5000, status: "applied" as const };
    const op2 = { ...transfer, id: 900_002, level: 5000, status: "applied" as const };
    mockGetAccountOperations.mockResolvedValueOnce([op1, op2]).mockResolvedValueOnce([]);
    mockGetAccountTokenTransfers.mockResolvedValue([]);

    const [, token] = await listOperations(someSenderAddress, {
      sort: "Descending",
      minHeight: 0,
      limit: 2,
    });

    expect(JSON.parse(token)).toEqual(
      expect.objectContaining({
        lastLevel: 5000,
        nativeLastId: 900_002,
      }),
    );

    await listOperations(someSenderAddress, {
      sort: "Descending",
      minHeight: 0,
      limit: 2,
      token,
    });

    expect(mockGetAccountOperations).toHaveBeenLastCalledWith(
      someSenderAddress,
      expect.objectContaining({
        "level.lt": 5001,
        lastId: 900_002,
        sort: "Descending",
        "level.ge": 0,
        limit: 2,
      }),
    );
  });

  it("emits tokenLastId on full single-level token page and forwards id.lt on next request", async () => {
    const fa2a: APITokenTransfer & { hash: string } = {
      id: 9105,
      level: 6000,
      timestamp: "2023-06-01T17:00:00Z",
      token: {
        id: 6,
        contract: { address: "KT1IntraTok" },
        tokenId: "0",
        standard: "fa2",
      },
      from: { address: someSenderAddress },
      to: { address: someDestinationAddress },
      amount: "1",
      hash: "ooTokA",
    };
    const fa2b: APITokenTransfer & { hash: string } = {
      ...fa2a,
      id: 9106,
      hash: "ooTokB",
    };
    mockGetAccountOperations.mockResolvedValue([]);
    mockGetAccountTokenTransfers.mockResolvedValueOnce([fa2b, fa2a]).mockResolvedValueOnce([]);

    const [, cursor] = await listOperations(someDestinationAddress, {
      sort: "Descending",
      minHeight: 0,
      limit: 2,
    });

    expect(JSON.parse(cursor)).toEqual(
      expect.objectContaining({
        lastLevel: 6000,
        tokenLastId: 9105,
      }),
    );

    await listOperations(someDestinationAddress, {
      sort: "Descending",
      minHeight: 0,
      limit: 2,
      token: cursor,
    });

    expect(mockGetAccountTokenTransfers).toHaveBeenLastCalledWith(
      someDestinationAddress,
      expect.objectContaining({
        "level.lt": 6001,
        "id.lt": 9105,
        sort: "Descending",
        "level.ge": 0,
        limit: 2,
      }),
    );
  });

  it("aligns native and token streams to the same boundary level (descending)", async () => {
    const parentTx: APITransactionType = {
      ...transfer,
      id: 80020,
      level: 1000,
      status: "applied" as const,
    };
    const opOlder: APITransactionType = {
      ...transfer,
      id: 80021,
      level: 500,
      status: "applied" as const,
    };
    const fa2At1000: APITokenTransfer & { hash: string } = {
      id: 80030,
      level: 1000,
      timestamp: "2023-06-01T12:00:00Z",
      token: {
        id: 1,
        contract: { address: "KT1TokenContract" },
        tokenId: "0",
        standard: "fa2",
        metadata: { decimals: "6" },
      },
      from: { address: someSenderAddress },
      to: { address: someDestinationAddress },
      amount: "1",
      transactionId: parentTx.id,
      hash: someHash,
    };
    const fa2Old: APITokenTransfer & { hash: string } = {
      ...fa2At1000,
      id: 80031,
      level: 400,
      hash: "ooOldTok",
    };
    mockGetAccountOperations.mockResolvedValue([parentTx, opOlder]);
    mockGetAccountTokenTransfers.mockResolvedValue([fa2At1000, fa2Old]);
    const [results] = await listOperations(someDestinationAddress, {
      sort: "Descending",
      minHeight: 0,
      limit: 2,
    });
    expect(results.some(o => o.tx.hash === "ooOldTok")).toBe(false);
    expect(results.filter(o => o.asset.type === "native")).toHaveLength(1);
    expect(results.filter(o => o.asset.type === "fa2")).toHaveLength(1);
    expect(results.find(o => o.asset.type === "fa2")?.tx.hash).toBe(someHash);
  });

  describe("both streams exhausted: skip alignment, return all ops", () => {
    const nativeOp1: APITransactionType = {
      ...transfer,
      id: 70_001,
      level: 500,
      status: "applied" as const,
    };
    const nativeOp2: APITransactionType = {
      ...transfer,
      id: 70_002,
      level: 600,
      status: "applied" as const,
    };
    const tokenAtLowLevel: APITokenTransfer & { hash: string } = {
      id: 71_001,
      level: 100,
      timestamp: "2024-06-01T00:00:00Z",
      token: {
        id: 1,
        contract: { address: "KT1Low" },
        tokenId: "0",
        standard: "fa2",
      },
      from: { address: someSenderAddress },
      to: { address: someDestinationAddress },
      amount: "1",
      hash: "ooLowLevelToken",
    };

    it("ascending: all ops returned in one page when both streams are exhausted", async () => {
      // 2 native ops (500, 600) + 1 token (100), limit=10 → neither full.
      // Without fix: boundary=100, native ops aligned away and lost.
      // With fix: bothExhausted=true, boundary skipped, all 3 ops returned.
      mockGetAccountOperations.mockResolvedValueOnce([nativeOp1, nativeOp2]);
      mockGetAccountTokenTransfers.mockResolvedValueOnce([tokenAtLowLevel]);

      const [page, cursor] = await listOperations(someDestinationAddress, {
        sort: "Ascending",
        minHeight: 0,
        limit: 10,
      });

      expect(page.filter(o => o.asset.type === "native")).toHaveLength(2);
      expect(page.filter(o => o.asset.type === "fa2")).toHaveLength(1);
      expect(cursor).toBe("");
    });

    it("descending: all ops returned in one page when both streams are exhausted", async () => {
      // Same data, descending. Without fix: boundary=500, token op lost.
      mockGetAccountOperations.mockResolvedValueOnce([nativeOp2, nativeOp1]);
      mockGetAccountTokenTransfers.mockResolvedValueOnce([tokenAtLowLevel]);

      const [page, cursor] = await listOperations(someDestinationAddress, {
        sort: "Descending",
        minHeight: 0,
        limit: 10,
      });

      expect(page.filter(o => o.asset.type === "native")).toHaveLength(2);
      expect(page.filter(o => o.asset.type === "fa2")).toHaveLength(1);
      expect(cursor).toBe("");
    });
  });

  it("native empty, token has ops: returns token ops without cursor", async () => {
    const fa2: APITokenTransfer & { hash: string } = {
      id: 72_001,
      level: 300,
      timestamp: "2024-06-01T00:00:00Z",
      token: {
        id: 1,
        contract: { address: "KT1Tok" },
        tokenId: "0",
        standard: "fa2",
      },
      from: { address: someSenderAddress },
      to: { address: someDestinationAddress },
      amount: "5",
      hash: "ooOnlyToken",
    };
    mockGetAccountOperations.mockResolvedValueOnce([]);
    mockGetAccountTokenTransfers.mockResolvedValueOnce([fa2]);

    const [results, cursor] = await listOperations(someDestinationAddress, {
      sort: "Descending",
      minHeight: 0,
      limit: 10,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.asset.type).toBe("fa2");
    expect(cursor).toBe("");
  });

  it("token full, native not full: cursor emitted via tokenFull", async () => {
    // token returns exactly limit ops → full, native returns fewer → not full.
    // Alignment runs normally, cursor emitted because tokenFull=true.
    const nativeHigh: APITransactionType = {
      ...transfer,
      id: 73_001,
      level: 2000,
      status: "applied" as const,
    };
    const fa2Low: APITokenTransfer & { hash: string } = {
      id: 73_002,
      level: 800,
      timestamp: "2024-06-01T00:00:00Z",
      token: {
        id: 1,
        contract: { address: "KT1TokFull" },
        tokenId: "0",
        standard: "fa2",
      },
      from: { address: someSenderAddress },
      to: { address: someDestinationAddress },
      amount: "1",
      hash: "ooTokFull1",
    };
    const fa2High: APITokenTransfer & { hash: string } = {
      ...fa2Low,
      id: 73_003,
      level: 2000,
      hash: "ooTokFull2",
    };
    // limit=2: token returns 2 (full), native returns 1 (not full)
    mockGetAccountOperations.mockResolvedValueOnce([nativeHigh]);
    mockGetAccountTokenTransfers.mockResolvedValueOnce([fa2High, fa2Low]);

    const [, cursor] = await listOperations(someDestinationAddress, {
      sort: "Descending",
      minHeight: 0,
      limit: 2,
    });

    expect(cursor).not.toBe("");
  });

  describe("FA2 assetReference must include tokenId", () => {
    const makeFA2Transfer = (
      tokenId: string,
      contractAddress: string,
      id: number,
    ): APITokenTransfer & { hash: string } => ({
      id,
      level: 200,
      timestamp: "2024-01-01T00:00:00Z",
      token: {
        id: 1,
        contract: { address: contractAddress },
        tokenId,
        standard: "fa2",
      },
      from: { address: someSenderAddress },
      to: { address: someDestinationAddress },
      amount: "100",
      hash: "ooLive30344Hash",
    });

    it("includes tokenId in assetReference for a non-zero tokenId", async () => {
      mockGetAccountOperations.mockResolvedValue([]);
      mockGetAccountTokenTransfers.mockResolvedValue([
        makeFA2Transfer("42", "KT1MultiToken", 10_001),
      ]);
      const [results] = await listOperations(someDestinationAddress, options);
      const op = results.find(o => o.asset.type === "fa2");
      expect(op!.asset).toMatchObject({ assetReference: "KT1MultiToken:42" });
    });

    it("includes :0 suffix in assetReference when tokenId is 0", async () => {
      mockGetAccountOperations.mockResolvedValue([]);
      mockGetAccountTokenTransfers.mockResolvedValue([makeFA2Transfer("0", "KT1Standard", 10_002)]);
      const [results] = await listOperations(someDestinationAddress, options);
      const op = results.find(o => o.asset.type === "fa2");
      expect(op!.asset).toMatchObject({ assetReference: "KT1Standard:0" });
    });

    it("defaults to :0 suffix when tokenId is undefined", async () => {
      const fa2NoTokenId: APITokenTransfer & { hash: string } = {
        ...makeFA2Transfer("0", "KT1NoId", 10_003),
        // @ts-expect-error testing missing tokenId
        token: { id: 1, contract: { address: "KT1NoId" }, standard: "fa2" },
      };
      mockGetAccountOperations.mockResolvedValue([]);
      mockGetAccountTokenTransfers.mockResolvedValue([fa2NoTokenId]);
      const [results] = await listOperations(someDestinationAddress, options);
      const op = results.find(o => o.asset.type === "fa2");
      expect(op!.asset).toMatchObject({ assetReference: "KT1NoId:0" });
    });
  });

  describe("staking operations (Paris adaptive issuance)", () => {
    const stakerAddress = "tz1dKrT1h6d7wP8fEzMPptG6er7mLLeQjBBY";
    const bakerAddress = "tz3Q67aMz7gSMiQRcW729sXSfuMtkyAHYfqc";

    function makeStaking(action: APIStakingType["action"], amount: number): APIStakingType {
      return {
        ...commonTx,
        id: 555_000 + (action === "stake" ? 1 : action === "unstake" ? 2 : 3),
        type: "staking",
        action,
        amount,
        requestedAmount: amount,
        sender: { address: stakerAddress },
        staker: { address: stakerAddress },
        baker: { address: bakerAddress, alias: "TF Test Baker" },
        counter: commonTx.counter + 1,
        bakerFee: 800,
        status: "applied",
      };
    }

    it.each([
      ["stake", "STAKE", 500_000_000n, [stakerAddress], [bakerAddress]],
      ["unstake", "UNSTAKE", 250_000_000n, [stakerAddress], [bakerAddress]],
      ["finalize", "FINALIZE_UNSTAKE", 0n, [bakerAddress], [stakerAddress]],
    ] as const)(
      "maps action %s to operation type %s with amount as value",
      async (action, expectedType, expectedAmount, expectedSenders, expectedRecipients) => {
        const op = makeStaking(action, Number(expectedAmount));
        mockGetAccountOperations.mockResolvedValue([op]);

        const [results] = await listOperations(stakerAddress, options);

        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({
          type: expectedType,
          value: expectedAmount,
          senders: expectedSenders,
          recipients: expectedRecipients,
          details: expect.objectContaining({ ledgerOpType: expectedType }),
        });
      },
    );

    it("surfaces finalize_unstake to the staker even when a third party pays the gas", async () => {
      const helperAddress = "tz1i92Eptw7UZ8JSb8j8jBFJ9Poa4TTnSQwZ";
      const op: APIStakingType = {
        ...makeStaking("finalize", 250_000_000),
        sender: { address: helperAddress },
      };
      mockGetAccountOperations.mockResolvedValue([op]);

      const [results] = await listOperations(stakerAddress, options);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        type: "FINALIZE_UNSTAKE",
        senders: [bakerAddress],
        recipients: [stakerAddress],
        tx: expect.objectContaining({ feesPayer: helperAddress }),
      });
    });

    it("uses sender as feesPayer for staking operations", async () => {
      mockGetAccountOperations.mockResolvedValue([makeStaking("stake", 100)]);
      const [results] = await listOperations(stakerAddress, options);
      expect(results[0].tx.feesPayer).toBe(stakerAddress);
    });

    it("falls back to requestedAmount when amount is missing on a failed staking op", async () => {
      const op = {
        ...makeStaking("stake", 0),
        status: "failed",
        amount: undefined,
        requestedAmount: 500_000_000,
      } as unknown as APIStakingType;
      mockGetAccountOperations.mockResolvedValue([op]);

      const [results] = await listOperations(stakerAddress, options);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(500_000_000n);
    });

    it("returns 0 when both amount and requestedAmount are missing on a staking op", async () => {
      const op = {
        ...makeStaking("stake", 0),
        status: "failed",
        amount: undefined,
        requestedAmount: undefined,
      } as unknown as APIStakingType;
      mockGetAccountOperations.mockResolvedValue([op]);

      const [results] = await listOperations(stakerAddress, options);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(0n);
    });

    it("includes staking ops alongside transfers in pagination", async () => {
      const stake = makeStaking("stake", 100);
      mockGetAccountOperations.mockResolvedValue([stake]);
      const [results, token] = await listOperations(stakerAddress, options);
      expect(results.length).toBe(1);
      expect(token).toBe("");
    });

    it("backfills missing block hashes via a single batched request, deduped per level", async () => {
      const stakeNoBlock = { ...makeStaking("stake", 100), block: undefined, level: 3106279 };
      const unstakeNoBlock = { ...makeStaking("unstake", 50), block: undefined, level: 3106279 };
      const finalizeNoBlock = { ...makeStaking("finalize", 0), block: undefined, level: 3106400 };

      mockGetAccountOperations.mockResolvedValue([stakeNoBlock, unstakeNoBlock, finalizeNoBlock]);
      mockGetBlockHashesByLevels.mockImplementation(
        async (levels: number[]) => new Map(levels.map(level => [level, `BL-fetched-${level}`])),
      );

      const [results] = await listOperations(stakerAddress, options);

      expect(results).toHaveLength(3);
      expect(results.map(r => r.tx.block.hash).sort()).toEqual([
        "BL-fetched-3106279",
        "BL-fetched-3106279",
        "BL-fetched-3106400",
      ]);

      expect(mockGetBlockHashesByLevels).toHaveBeenCalledTimes(1);
      expect(mockGetBlockHashesByLevels.mock.calls[0][0].sort()).toEqual([3106279, 3106400]);
    });

    it("does not call getBlockHashesByLevels when staking ops already carry a block (string)", async () => {
      mockGetAccountOperations.mockResolvedValue([makeStaking("stake", 100)]);

      await listOperations(stakerAddress, options);

      expect(mockGetBlockHashesByLevels).not.toHaveBeenCalled();
    });

    it("uses block.hash when TzKT inlines the full block object on staking ops", async () => {
      const inlineBlock = {
        cycle: 1,
        level: 3106307,
        hash: "BLMaHTGtBfh7ZM2wk5rpFHQhNtx5LC7YMdYrnokzBcosrpgqNAe",
        timestamp: "2026-04-28T20:54:09Z",
      } as unknown as APIBlock;
      const stakeWithObjectBlock = {
        ...makeStaking("stake", 100),
        block: inlineBlock,
        level: 3106307,
      };
      mockGetAccountOperations.mockResolvedValue([stakeWithObjectBlock]);

      const [results] = await listOperations(stakerAddress, options);

      expect(results).toHaveLength(1);
      expect(results[0].tx.block.hash).toBe(inlineBlock.hash);
      expect(mockGetBlockHashesByLevels).not.toHaveBeenCalled();
    });

    it("falls back to empty hash when the batched fetch fails", async () => {
      const op = { ...makeStaking("stake", 100), block: undefined, level: 4_200_000 };
      mockGetAccountOperations.mockResolvedValue([op]);
      mockGetBlockHashesByLevels.mockRejectedValue(new Error("rpc 503"));

      const [results] = await listOperations(stakerAddress, options);

      expect(results).toHaveLength(1);
      expect(results[0].tx.block.hash).toBe("");
    });

    it("falls back to empty hash for levels missing from the batched response", async () => {
      const present = { ...makeStaking("stake", 100), block: undefined, level: 4_200_000 };
      const absent = { ...makeStaking("unstake", 50), block: undefined, level: 4_200_001 };
      mockGetAccountOperations.mockResolvedValue([present, absent]);
      mockGetBlockHashesByLevels.mockResolvedValue(new Map([[4_200_000, "BL-4200000"]]));

      const [results] = await listOperations(stakerAddress, options);

      const byLevel = Object.fromEntries(results.map(r => [r.tx.block.height, r.tx.block.hash]));
      expect(byLevel[4_200_000]).toBe("BL-4200000");
      expect(byLevel[4_200_001]).toBe("");
    });
  });

  describe("origination operations", () => {
    const originatorAddress = "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb";

    function makeOrigination(overrides: Record<string, unknown> = {}) {
      return {
        type: "origination",
        id: 621018843447296,
        hash: "onhQ1vG21TosVKCWrwBeYKkRMnTGe34D2ZiaSs6jGQYpw9Z9r1m",
        level: 3723919,
        timestamp: "2023-06-17T15:31:51Z",
        block: "BL5gN6AzyYzstxxheqdbYvFiqHUWZFCsS7knAE8AtiLRJeDTEZ5",
        counter: 10150476,
        sender: { address: originatorAddress },
        bakerFee: 5980,
        storageFee: 1398750,
        allocationFee: 64250,
        gasLimit: 3494,
        storageLimit: 5852,
        contractBalance: 0,
        status: "applied",
        originatedContract: { address: "KT1PM9HfQ9ZkQoG4UwtuZjrnUywQhokxJxRo" },
        ...overrides,
      };
    }

    it("surfaces origination as a FEES operation with correct fees", async () => {
      mockGetAccountOperations.mockResolvedValue([makeOrigination()]);
      const [results] = await listOperations(originatorAddress, options);

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe("FEES");
      expect(results[0].value).toBe(0n);
      expect(results[0].tx.fees).toBe(5980n + 1398750n + 64250n);
      expect(results[0].tx.feesPayer).toBe(originatorAddress);
      expect(results[0].details?.ledgerOpType).toBe("ORIGINATION");
    });

    it("surfaces origination as OUT when contractBalance > 0", async () => {
      mockGetAccountOperations.mockResolvedValue([makeOrigination({ contractBalance: 1000000 })]);
      const [results] = await listOperations(originatorAddress, options);

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe("OUT");
      expect(results[0].value).toBe(1000000n);
    });

    it("includes counter in details", async () => {
      mockGetAccountOperations.mockResolvedValue([makeOrigination()]);
      const [results] = await listOperations(originatorAddress, options);

      expect(results[0].details?.counter).toBe(10150476);
    });
  });
});
