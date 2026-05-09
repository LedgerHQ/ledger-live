import { graphqlTxToJsonRpcResponse, type GraphQLTransactionNode } from "./transactions";

/** Minimal fake GraphQL tx node — fills only fields the projector reads. */
const fakeTx = (overrides: Partial<GraphQLTransactionNode> = {}): GraphQLTransactionNode =>
  ({
    digest: "0xabc",
    transactionJson: null,
    effects: null,
    ...overrides,
  }) as unknown as GraphQLTransactionNode;

describe("graphqlTxToJsonRpcResponse", () => {
  it("returns a v1 envelope with safe defaults when all fields are missing; absent status maps to failure", () => {
    const out = graphqlTxToJsonRpcResponse(fakeTx());
    expect(out.digest).toBe("0xabc");
    expect(out.transaction?.data.messageVersion).toBe("v1");
    expect(out.transaction?.data.sender).toBe("");
    expect(out.transaction?.data.gasData).toEqual({});
    expect(out.effects?.messageVersion).toBe("v1");
    // Missing status defaults to failure so partial/indexing-lagged responses can't mask real failures.
    expect(out.effects?.status).toEqual({
      status: "failure",
      error: "transaction execution failed",
    });
    expect(out.effects?.gasUsed).toEqual({
      computationCost: "0",
      storageCost: "0",
      storageRebate: "0",
      nonRefundableStorageFee: "0",
    });
    expect(out.events).toEqual([]);
    expect(out.balanceChanges).toEqual([]);
    expect(out.timestampMs).toBeNull();
    expect(out.checkpoint).toBeNull();
  });

  it("unwraps the inner Move transaction when transactionJson nests `.transaction`", () => {
    const inner = { Move: { kind: "transfer" } };
    const out = graphqlTxToJsonRpcResponse(
      fakeTx({
        transactionJson: { transaction: inner, sender: "0xsender", gasData: { price: "1000" } },
      } as unknown as Partial<GraphQLTransactionNode>),
    );
    expect(out.transaction?.data.transaction).toEqual(inner);
    expect(out.transaction?.data.sender).toBe("0xsender");
    expect(out.transaction?.data.gasData).toEqual({ price: "1000" });
  });

  it("uses transactionJson itself as the inner Move transaction when not nested", () => {
    const flat = { kind: "ProgrammableTransaction", commands: [] };
    const out = graphqlTxToJsonRpcResponse(
      fakeTx({ transactionJson: flat } as unknown as Partial<GraphQLTransactionNode>),
    );
    expect(out.transaction?.data.transaction).toEqual(flat);
  });

  it("maps FAILURE status to JSON-RPC failure with extracted error description", () => {
    const out = graphqlTxToJsonRpcResponse(
      fakeTx({
        effects: {
          status: "FAILURE",
          effectsJson: { status: { error: { description: "InsufficientGas" } } },
        },
      } as unknown as Partial<GraphQLTransactionNode>),
    );
    expect(out.effects?.status).toEqual({ status: "failure", error: "InsufficientGas" });
  });

  it("falls back to generic message when FAILURE effectsJson has no usable error fields", () => {
    const out = graphqlTxToJsonRpcResponse(
      fakeTx({
        effects: { status: "FAILURE", effectsJson: {} },
      } as unknown as Partial<GraphQLTransactionNode>),
    );
    expect(out.effects?.status).toEqual({
      status: "failure",
      error: "transaction execution failed",
    });
  });

  it("maps SUCCESS status to JSON-RPC success", () => {
    const out = graphqlTxToJsonRpcResponse(
      fakeTx({ effects: { status: "SUCCESS" } } as unknown as Partial<GraphQLTransactionNode>),
    );
    expect(out.effects?.status).toEqual({ status: "success" });
  });

  it("projects gas summary fields", () => {
    const out = graphqlTxToJsonRpcResponse(
      fakeTx({
        effects: {
          gasEffects: {
            gasSummary: {
              computationCost: "1000",
              storageCost: "2000",
              storageRebate: "500",
              nonRefundableStorageFee: "10",
            },
          },
        },
      } as unknown as Partial<GraphQLTransactionNode>),
    );
    expect(out.effects?.gasUsed).toEqual({
      computationCost: "1000",
      storageCost: "2000",
      storageRebate: "500",
      nonRefundableStorageFee: "10",
    });
  });

  it("projects events with safe defaults for missing contents", () => {
    const out = graphqlTxToJsonRpcResponse(
      fakeTx({
        effects: {
          events: {
            nodes: [
              { contents: { type: { repr: "0x2::staking::Event" }, json: { foo: "bar" } } },
              { contents: null },
            ],
          },
        },
      } as unknown as Partial<GraphQLTransactionNode>),
    );
    expect(out.events).toHaveLength(2);
    expect(out.events?.[0]).toMatchObject({
      id: { txDigest: "0xabc", eventSeq: "0" },
      type: "0x2::staking::Event",
      parsedJson: { foo: "bar" },
    });
    expect(out.events?.[1]).toMatchObject({ type: "", parsedJson: {} });
  });

  it("converts timestamp + checkpoint sequenceNumber when present", () => {
    const iso = "2026-05-12T00:00:00.000Z";
    const out = graphqlTxToJsonRpcResponse(
      fakeTx({
        effects: { timestamp: iso, checkpoint: { sequenceNumber: 12345 } },
      } as unknown as Partial<GraphQLTransactionNode>),
    );
    expect(out.timestampMs).toBe(String(new Date(iso).getTime()));
    expect(out.checkpoint).toBe("12345");
  });

  describe("normaliseBalanceChanges (via balanceChangesJson)", () => {
    it("returns [] when balanceChangesJson is not an array", () => {
      const out = graphqlTxToJsonRpcResponse(
        fakeTx({
          effects: { balanceChangesJson: "not-an-array" },
        } as unknown as Partial<GraphQLTransactionNode>),
      );
      expect(out.balanceChanges).toEqual([]);
    });

    it("passes through entries that already have an object `owner` (JSON-RPC shape)", () => {
      const wrapped = { owner: { AddressOwner: "0x1" }, amount: "100" };
      const out = graphqlTxToJsonRpcResponse(
        fakeTx({
          effects: { balanceChangesJson: [wrapped] },
        } as unknown as Partial<GraphQLTransactionNode>),
      );
      expect(out.balanceChanges).toEqual([wrapped]);
    });

    it("wraps a bare-string `owner` from gRPC proto into AddressOwner shape", () => {
      const out = graphqlTxToJsonRpcResponse(
        fakeTx({
          effects: { balanceChangesJson: [{ owner: "0x1", amount: "100" }] },
        } as unknown as Partial<GraphQLTransactionNode>),
      );
      expect(out.balanceChanges).toEqual([
        { owner: { AddressOwner: "0x1" }, amount: "100" },
      ]);
    });

    it("falls back to `address` when owner is missing", () => {
      const out = graphqlTxToJsonRpcResponse(
        fakeTx({
          effects: { balanceChangesJson: [{ address: "0x2", amount: "50" }] },
        } as unknown as Partial<GraphQLTransactionNode>),
      );
      expect(out.balanceChanges).toEqual([
        { address: "0x2", owner: { AddressOwner: "0x2" }, amount: "50" },
      ]);
    });

    it("passes through non-object entries unchanged", () => {
      const out = graphqlTxToJsonRpcResponse(
        fakeTx({
          effects: { balanceChangesJson: [null, undefined, 42, "string"] },
        } as unknown as Partial<GraphQLTransactionNode>),
      );
      expect(out.balanceChanges).toEqual([null, undefined, 42, "string"]);
    });
  });

  it("propagates effectsJson.accumulatorEvents as a passthrough", () => {
    const accumulatorEvents = [{ kind: "merge" }];
    const out = graphqlTxToJsonRpcResponse(
      fakeTx({
        effects: { effectsJson: { accumulatorEvents } },
      } as unknown as Partial<GraphQLTransactionNode>),
    );
    expect((out.effects as unknown as { accumulatorEvents: unknown[] }).accumulatorEvents).toBe(
      accumulatorEvents,
    );
  });
});
