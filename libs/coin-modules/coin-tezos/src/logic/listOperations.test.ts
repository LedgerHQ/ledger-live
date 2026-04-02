import type {
  APIDelegationType,
  APIRevealType,
  APITokenTransfer,
  APITransactionType,
} from "../network/types";
import { listOperations } from "./listOperations";

const mockGetAccountOperations = jest.fn();
const mockGetAccountTokenTransfers = jest.fn();

jest.mock("../network", () => ({
  tzkt: {
    getAccountOperations: async (address: string, options: unknown) =>
      mockGetAccountOperations(address, options),
    getAccountTokenTransfers: async (address: string, options: unknown) =>
      mockGetAccountTokenTransfers(address, options),
  },
}));

const options: { sort: "Ascending" | "Descending"; minHeight: number } = {
  sort: "Ascending",
  minHeight: 0,
};

describe("listOperations", () => {
  afterEach(() => {
    mockGetAccountOperations.mockClear();
    mockGetAccountTokenTransfers.mockClear();
  });

  beforeEach(() => {
    mockGetAccountOperations.mockResolvedValue([]);
    mockGetAccountTokenTransfers.mockResolvedValue([]);
  });

  it("forwards tokenLastId from pagination cursor as lastId to getAccountTokenTransfers", async () => {
    await listOperations("tz1PaginationAddr", {
      ...options,
      token: JSON.stringify({ nativeLastId: 111, tokenLastId: 222 }),
    });

    expect(mockGetAccountOperations).toHaveBeenCalledWith(
      "tz1PaginationAddr",
      expect.objectContaining({
        lastId: 111,
        sort: options.sort,
        "level.ge": options.minHeight,
      }),
    );
    expect(mockGetAccountTokenTransfers).toHaveBeenCalledWith(
      "tz1PaginationAddr",
      expect.objectContaining({
        lastId: 222,
        sort: options.sort,
        "level.ge": options.minHeight,
      }),
    );
  });

  it("parses legacy numeric pagination cursor as native lastId only", async () => {
    await listOperations("tz1Legacy", {
      ...options,
      token: JSON.stringify(99_999),
    });

    expect(mockGetAccountOperations).toHaveBeenCalledWith(
      "tz1Legacy",
      expect.objectContaining({ lastId: 99_999 }),
    );
    const [, legacyTokenOpts] = mockGetAccountTokenTransfers.mock.calls[0];
    expect(legacyTokenOpts).not.toHaveProperty("lastId");
  });

  it("ignores invalid pagination cursor JSON", async () => {
    await listOperations("tz1BadCursor", {
      ...options,
      token: "not-valid-json{",
    });

    const [, nativeOpts] = mockGetAccountOperations.mock.calls[0];
    const [, tokenOpts] = mockGetAccountTokenTransfers.mock.calls[0];
    expect(nativeOpts).not.toHaveProperty("lastId");
    expect(tokenOpts).not.toHaveProperty("lastId");
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
      // When
      const [results] = await listOperations("any address", options);
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
    "should return %s operation with pagination equal to operation id",
    async (_label, operation) => {
      // Given
      mockGetAccountOperations.mockResolvedValue([operation]);
      // When
      const [results, token] = await listOperations("any address", options);
      // Then
      expect(results.length).toEqual(1);
      expect(token).toEqual(JSON.stringify({ nativeLastId: operation.id }));
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
      const [results, _] = await listOperations("any address", options);
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
    const [results, token] = await listOperations("any address", options);
    // Then
    expect(results.length).toEqual(1);
    expect(results[0].recipients).toEqual([]);
    expect(token).toEqual(JSON.stringify({ nativeLastId: operation.id }));
  });

  it.each([
    ["undelegate", { ...undelegate, storageFee: 1, bakerFee: 2, allocationFee: 3 }],
    ["delegate", { ...delegate, storageFee: 1, bakerFee: 2, allocationFee: 3 }],
    ["transfer", { ...transfer, storageFee: 1, bakerFee: 2, allocationFee: 3 }],
  ])("should compute the fees properly for %s operation", async (_label, operation) => {
    // Given
    mockGetAccountOperations.mockResolvedValue([operation]);
    // When
    const [results, _] = await listOperations("any address", options);
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
    expect(token).toEqual(JSON.stringify({ nativeLastId: operation.id }));
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
      const [results] = await listOperations("any address", options);
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
      const [results] = await listOperations("any address", options);
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
    const appliedTransfer = { ...transfer, status: "applied" as const };
    mockGetAccountOperations.mockResolvedValue([appliedTransfer]);
    mockGetAccountTokenTransfers.mockResolvedValue([fa2]);
    const [results, next] = await listOperations(someDestinationAddress, options);
    const tokenOp = results.find(o => o.asset.type === "fa2");

    expect(JSON.parse(next)).toEqual({
      nativeLastId: appliedTransfer.id,
      tokenLastId: fa2.id,
    });

    expect(tokenOp).toMatchObject({
      type: "IN",
      value: 1_000_000n,
      asset: {
        type: "fa2",
        assetReference: "KT1TokenContract",
        assetOwner: someDestinationAddress,
        unit: { magnitude: 6, name: "Tok", code: "TOK" },
      },
      tx: {
        hash: someHash,
        fees: 6n,
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
    expect(out).toBeDefined();
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
    expect(row).toBeDefined();
    expect(row!.type).toBe("IN");
    expect(row!.details.ledgerOpType).toBeUndefined();
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
    expect(selfRow).toBeDefined();
    expect(selfRow!.type).toBe("FEES");
    expect(selfRow!.details.ledgerOpType).toBe("FEES");
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
    expect(zeroRow).toBeDefined();
    expect(zeroRow!.type).toBe("FEES");
    expect(zeroRow!.details.ledgerOpType).toBe("FEES");
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
    expect(tokenOut).toBeDefined();
    expect(tokenOut!.type).toBe("OUT");
    expect(tokenOut!.details.ledgerOpType).toBe("OUT");
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
    expect(tokenSelf).toBeDefined();
    expect(tokenSelf!.type).toBe("FEES");
    expect(tokenSelf!.details.ledgerOpType).toBe("FEES");
  });

  it("FA2 transfer without parent transaction omits fees and uses empty block hash", async () => {
    const fa2Orphan: APITokenTransfer & { hash: string } = {
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
    };
    mockGetAccountOperations.mockResolvedValue([]);
    mockGetAccountTokenTransfers.mockResolvedValue([fa2Orphan]);
    const [results] = await listOperations(someDestinationAddress, options);
    const orphan = results.find(o => o.asset.type === "fa2");
    expect(orphan).toBeDefined();
    expect(orphan!.tx.fees).toBe(0n);
    expect(orphan!.tx.feesPayer).toBeUndefined();
    expect(orphan!.tx.block.hash).toBe("");
    expect(orphan!.tx.failed).toBe(false);
  });
});
