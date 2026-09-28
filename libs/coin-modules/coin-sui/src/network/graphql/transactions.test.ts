import { graphqlTxToSuiTransaction, type GraphQLTransactionNode } from "./transactions";

/** Minimal fake GraphQL tx node — fills only fields the projector reads. */
const fakeTx = (overrides: Record<string, unknown> = {}): GraphQLTransactionNode =>
  ({
    digest: "0xabc",
    transactionJson: null,
    effects: null,
    ...overrides,
  }) as unknown as GraphQLTransactionNode;

const LONG_SUI = "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI";

describe("graphqlTxToSuiTransaction", () => {
  it("returns safe defaults when all fields are missing; absent status maps to failure", () => {
    const out = graphqlTxToSuiTransaction(fakeTx());
    expect(out).toEqual({
      digest: "0xabc",
      transaction: {
        data: {
          transaction: { kind: "System", name: "SystemTransaction" },
          sender: "",
          gasData: { owner: undefined },
        },
      },
      // Missing status defaults to failure so partial/indexing-lagged responses can't mask real
      // failures.
      effects: {
        status: { status: "failure", error: "transaction execution failed" },
        gasUsed: { computationCost: "0", storageCost: "0", storageRebate: "0" },
        accumulatorEvents: [],
      },
      events: [],
      balanceChanges: [],
      timestampMs: null,
      checkpoint: null,
    });
  });

  it("names a non-programmable proto kind in PascalCase, like the gRPC mapper", () => {
    const out = graphqlTxToSuiTransaction(
      fakeTx({
        transactionJson: { kind: { kind: "CONSENSUS_COMMIT_PROLOGUE_V4" }, sender: "0x0" },
      }),
    );
    expect(out.transaction.data.transaction).toEqual({
      kind: "System",
      name: "ConsensusCommitPrologueV4",
    });
  });

  // Only the proto shape is accepted: a JSON-RPC-shaped payload carries no proto `kind` tag.
  it("does not read a JSON-RPC-shaped transactionJson as programmable", () => {
    const out = graphqlTxToSuiTransaction(
      fakeTx({
        transactionJson: {
          transaction: { kind: "ProgrammableTransaction", inputs: [], transactions: [] },
          sender: "0xsender",
          gasData: { owner: "0xsponsor" },
        },
      }),
    );
    expect(out.transaction.data.transaction.kind).toBe("System");
    expect(out.transaction.data.sender).toBe("0xsender");
    expect(out.transaction.data.gasData).toEqual({ owner: undefined });
  });

  it("maps FAILURE status to failure with extracted error description", () => {
    const out = graphqlTxToSuiTransaction(
      fakeTx({
        effects: {
          status: "FAILURE",
          effectsJson: { status: { error: { description: "InsufficientGas" } } },
        },
      }),
    );
    expect(out.effects.status).toEqual({ status: "failure", error: "InsufficientGas" });
  });

  it("falls back to generic message when FAILURE effectsJson has no usable error fields", () => {
    const out = graphqlTxToSuiTransaction(
      fakeTx({ effects: { status: "FAILURE", effectsJson: {} } }),
    );
    expect(out.effects.status).toEqual({
      status: "failure",
      error: "transaction execution failed",
    });
  });

  it("maps SUCCESS status to success", () => {
    const out = graphqlTxToSuiTransaction(fakeTx({ effects: { status: "SUCCESS" } }));
    expect(out.effects.status).toEqual({ status: "success" });
  });

  it("projects gas summary fields as strings", () => {
    const out = graphqlTxToSuiTransaction(
      fakeTx({
        effects: {
          gasEffects: {
            gasSummary: {
              computationCost: "1000",
              storageCost: 2000,
              storageRebate: "500",
              nonRefundableStorageFee: "10",
            },
          },
        },
      }),
    );
    expect(out.effects.gasUsed).toEqual({
      computationCost: "1000",
      storageCost: "2000",
      storageRebate: "500",
    });
  });

  it("projects events with safe defaults for missing contents", () => {
    const out = graphqlTxToSuiTransaction(
      fakeTx({
        effects: {
          events: {
            nodes: [
              { contents: { type: { repr: "0x2::staking::Event" }, json: { foo: "bar" } } },
              { contents: null },
            ],
          },
        },
      }),
    );
    expect(out.events).toEqual([
      { type: "0x2::staking::Event", parsedJson: { foo: "bar" } },
      { type: "", parsedJson: {} },
    ]);
  });

  it("normalises a long-form event type to the short form", () => {
    const out = graphqlTxToSuiTransaction(
      fakeTx({
        effects: {
          events: {
            nodes: [
              {
                contents: {
                  type: {
                    repr: "0x0000000000000000000000000000000000000000000000000000000000000003::validator::StakingRequestEvent",
                  },
                  json: { validator_address: "0xval" },
                },
              },
            ],
          },
        },
      }),
    );
    expect(out.events[0]).toEqual({
      type: "0x3::validator::StakingRequestEvent",
      parsedJson: { validator_address: "0xval" },
    });
  });

  it("converts timestamp + checkpoint sequenceNumber when present", () => {
    const iso = "2026-05-12T00:00:00.000Z";
    const out = graphqlTxToSuiTransaction(
      fakeTx({ effects: { timestamp: iso, checkpoint: { sequenceNumber: 12345 } } }),
    );
    expect(out.timestampMs).toBe(String(new Date(iso).getTime()));
    expect(out.checkpoint).toBe("12345");
  });

  describe("balance changes (via balanceChangesJson)", () => {
    const mapChanges = (balanceChangesJson: unknown) =>
      graphqlTxToSuiTransaction(fakeTx({ effects: { balanceChangesJson } })).balanceChanges;

    it("returns [] when balanceChangesJson is not an array", () => {
      expect(mapChanges("not-an-array")).toEqual([]);
    });

    it("reads the address from `address`", () => {
      expect(mapChanges([{ address: "0x2", coinType: "0x2::sui::SUI", amount: "50" }])).toEqual([
        { address: "0x2", coinType: "0x2::sui::SUI", amount: "50" },
      ]);
    });

    it("reads the address from a bare-string `owner`", () => {
      expect(mapChanges([{ owner: "0x1", coinType: "0x2::sui::SUI", amount: "100" }])).toEqual([
        { address: "0x1", coinType: "0x2::sui::SUI", amount: "100" },
      ]);
    });

    it("reads the address from an `{ AddressOwner }` owner", () => {
      expect(
        mapChanges([{ owner: { AddressOwner: "0x1" }, coinType: "0x2::sui::SUI", amount: "-100" }]),
      ).toEqual([{ address: "0x1", coinType: "0x2::sui::SUI", amount: "-100" }]);
    });

    it.each([
      ["a non-object entry", null],
      ["a number", 42],
      ["no resolvable address", { owner: { Shared: {} }, coinType: "0x2::sui::SUI", amount: "1" }],
      ["no coin type", { address: "0x1", amount: "1" }],
      ["a non-string amount", { address: "0x1", coinType: "0x2::sui::SUI", amount: 1 }],
    ])("drops an entry with %s", (_label, entry) => {
      expect(
        mapChanges([entry, { address: "0x9", coinType: "0x2::sui::SUI", amount: "7" }]),
      ).toEqual([{ address: "0x9", coinType: "0x2::sui::SUI", amount: "7" }]);
    });

    it("normalises a long-form SUI coinType to the short form", () => {
      const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
      expect(mapChanges([{ address, coinType: LONG_SUI, amount: "150000000" }])).toEqual([
        { address, coinType: "0x2::sui::SUI", amount: "150000000" },
      ]);
    });

    it("leaves a full-address token coinType unchanged (no leading zeros to strip)", () => {
      const tokenType =
        "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";
      expect(mapChanges([{ address: "0x1", coinType: tokenType, amount: "5" }])).toEqual([
        { address: "0x1", coinType: tokenType, amount: "5" },
      ]);
    });
  });

  describe("accumulator events (via effectsJson.accumulatorEvents)", () => {
    const mapEvents = (accumulatorEvents: unknown) =>
      graphqlTxToSuiTransaction(fakeTx({ effects: { effectsJson: { accumulatorEvents } } })).effects
        .accumulatorEvents;

    it("keeps a merge event", () => {
      const evt = {
        address: "0x1",
        ty: "0x2::balance::Balance<0x2::sui::SUI>",
        operation: "merge",
        value: { integer: "10" },
      };
      expect(mapEvents([evt])).toEqual([evt]);
    });

    it("keeps a split event", () => {
      const evt = { address: "0x1", ty: "t", operation: "split", value: { integer: "10" } };
      expect(mapEvents([evt])).toEqual([evt]);
    });

    // Defaulting an unknown operation to a debit would invert the sign of a balance change.
    it.each([["SPLIT"], ["burn"], [undefined]])("drops operation %p", operation => {
      expect(mapEvents([{ address: "0x1", ty: "t", operation, value: { integer: "10" } }])).toEqual(
        [],
      );
    });

    it.each([
      ["not an array", { kind: "merge" }],
      ["a non-object entry", [null]],
      ["no address", [{ ty: "t", operation: "merge", value: { integer: "1" } }]],
      ["no ty", [{ address: "0x1", operation: "merge", value: { integer: "1" } }]],
      ["an empty ty", [{ address: "0x1", ty: "", operation: "merge", value: { integer: "1" } }]],
      [
        "a non-integer value",
        [{ address: "0x1", ty: "t", operation: "merge", value: { pointer: "1" } }],
      ],
      ["no value", [{ address: "0x1", ty: "t", operation: "merge" }]],
    ])("drops input that is %s", (_label, raw) => {
      expect(mapEvents(raw)).toEqual([]);
    });
  });

  describe("gRPC-proto transactionJson mapping", () => {
    const SENDER = "0xf58d8d4ba6a2160f630c600a1b946cff4dac25c3fcac241e91bbd12791cd7528";
    const VALIDATOR = "0x4fffd0005522be4bc029724c7f0f6ed7093a6bf3a09b90e62f61dc15181e1a3e";
    const SYSTEM_STATE = "0x0000000000000000000000000000000000000000000000000000000000000005";
    const protoStakingTxJson = () => ({
      digest: "FTow2FZLfLEwd4gGy4PUmBGkMD6gK27gge374H2rbRtS",
      version: 1,
      kind: {
        kind: "PROGRAMMABLE_TRANSACTION",
        programmableTransaction: {
          inputs: [
            { kind: "PURE", pure: "gO9pf1EAAAA=" },
            {
              kind: "SHARED",
              objectId: SYSTEM_STATE,
              version: "1",
              mutable: true,
              mutability: "MUTABLE",
            },
            { kind: "PURE", pure: "T//QAFUivkvAKXJMfw9u1wk6a/Ogm5DmL2HcFRgeGj4=" },
          ],
          commands: [
            { splitCoins: { coin: { kind: "GAS" }, amounts: [{ kind: "INPUT", input: 0 }] } },
            {
              moveCall: {
                package: "0x0000000000000000000000000000000000000000000000000000000000000003",
                module: "sui_system",
                function: "request_add_stake",
                arguments: [
                  { kind: "INPUT", input: 1 },
                  { kind: "RESULT", result: 0 },
                  { kind: "INPUT", input: 2 },
                ],
              },
            },
          ],
        },
      },
      sender: SENDER,
      gasPayment: {
        objects: [
          {
            objectId: "0xf0db3db2b09626b123531b6da5415f20f50bd1e3105ba0792c355fc15e2fa863",
            version: "914617841",
            digest: "C6soxiMsseqw4fQp7p5Aa651K2QXBYf8ejr3U9Swi1bW",
          },
        ],
        owner: SENDER,
        price: "100",
        budget: "11815536",
      },
      expiration: { kind: "NONE" },
    });

    it("maps a proto ProgrammableTransaction to the kind/inputs/transactions shape", () => {
      const out = graphqlTxToSuiTransaction(fakeTx({ transactionJson: protoStakingTxJson() }));
      expect(out.transaction.data.transaction).toEqual({
        kind: "ProgrammableTransaction",
        inputs: [
          { type: "pure", valueType: "u64", value: "350030000000" },
          { type: "object", objectType: "sharedObject", objectId: SYSTEM_STATE, mutable: true },
          { type: "pure", valueType: "address", value: VALIDATOR },
        ],
        transactions: [
          { Other: "splitCoins" },
          {
            MoveCall: {
              package: "0x0000000000000000000000000000000000000000000000000000000000000003",
              module: "sui_system",
              function: "request_add_stake",
            },
          },
        ],
      });
      expect(out.transaction.data.sender).toBe(SENDER);
    });

    // `getFeesPayer` reads the gas owner; for a sponsored transaction it is the sponsor.
    it("maps the proto gasPayment owner", () => {
      const out = graphqlTxToSuiTransaction(fakeTx({ transactionJson: protoStakingTxJson() }));
      expect(out.transaction.data.gasData).toEqual({ owner: SENDER });
    });

    const mapInner = (inputs: unknown, commands: unknown) => {
      const block = graphqlTxToSuiTransaction(
        fakeTx({
          transactionJson: {
            kind: {
              kind: "PROGRAMMABLE_TRANSACTION",
              programmableTransaction: { inputs, commands },
            },
            sender: SENDER,
          },
        }),
      ).transaction.data.transaction;
      if (block.kind !== "ProgrammableTransaction") throw new Error("not programmable");
      return block;
    };

    it("keeps odd-sized pure inputs inert (no u64/address valueType claimed)", () => {
      // 3-byte payload: neither u64 (8) nor address (32)
      expect(mapInner([{ kind: "PURE", pure: "AQID" }], []).inputs).toEqual([
        { type: "pure", valueType: null, value: "AQID" },
      ]);
    });

    it("maps a pure input with no bytes to a null value", () => {
      expect(mapInner([{ kind: "PURE" }], []).inputs).toEqual([
        { type: "pure", valueType: null, value: null },
      ]);
    });

    it("maps immutable-or-owned / receiving object inputs and drops unknown input kinds", () => {
      const { inputs } = mapInner(
        [
          { kind: "IMMUTABLE_OR_OWNED", objectId: "0xobj1", version: "5", digest: "0xd1" },
          { kind: "RECEIVING", objectId: "0xobj2", version: "6", digest: "0xd2" },
          { kind: "FUTURE_INPUT_KIND", foo: 1 },
          null,
        ],
        [],
      );
      expect(inputs).toEqual([
        { type: "object", objectType: "immOrOwnedObject", objectId: "0xobj1" },
        { type: "object", objectType: "receiving", objectId: "0xobj2" },
      ]);
    });

    // `isSettlementTransaction` matches on `mutable === true`; anything else must read as immutable.
    it("reads a shared input without a boolean mutable as immutable", () => {
      expect(mapInner([{ kind: "SHARED", objectId: "0xacc", mutable: "true" }], []).inputs).toEqual(
        [{ type: "object", objectType: "sharedObject", objectId: "0xacc", mutable: false }],
      );
    });

    it("keeps only the tag of non-MoveCall commands", () => {
      const { transactions } = mapInner(
        [],
        [
          { mergeCoins: { coin: { kind: "GAS" }, coinsToMerge: [{ kind: "INPUT", input: 0 }] } },
          { transferObjects: { objects: [], address: { kind: "INPUT", input: 1 } } },
          { publish: { modules: [] } },
          {},
          null,
        ],
      );
      expect(transactions).toEqual([
        { Other: "mergeCoins" },
        { Other: "transferObjects" },
        { Other: "publish" },
        { Other: "Unknown" },
        { Other: "Unknown" },
      ]);
    });

    it("defaults missing MoveCall target fields to empty strings", () => {
      expect(mapInner([], [{ moveCall: { function: "f" } }]).transactions).toEqual([
        { MoveCall: { package: "", module: "", function: "f" } },
      ]);
    });

    it("treats non-array inputs and commands as empty", () => {
      expect(mapInner("nope", { not: "an array" })).toEqual({
        kind: "ProgrammableTransaction",
        inputs: [],
        transactions: [],
      });
    });
  });
});
