import { TokenCurrency } from "@domain/entity-currency-token";
import { buildSubAccounts, mergeSubAccounts } from "./buildSubAccounts";
import { SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";

describe("buildSubAccounts", () => {
  it("builds sub accounts from asset operations and balances, preserving operations order", async () => {
    const subAccounts = await buildSubAccounts({
      accountId: "accountId",
      allTokenAssetsBalances: [
        {
          value: 20n,
          locked: 5n,
          asset: { type: "token", assetReference: "usdc", assetOwner: "owner" },
        },
        { value: 30n, asset: { type: "token", assetReference: "usdt", assetOwner: "owner" } },
      ],
      syncConfig: { blacklistedTokenIds: [] } as unknown as SyncConfig,
      operations: [
        {
          hash: "tx-hash1",
          extra: {
            assetReference: "usdc",
            assetOwner: "owner",
            ledgerOpType: "OUT",
            assetSenders: ["owner"],
            assetRecipients: ["other"],
          },
        },
        {
          hash: "tx-hash2",
          extra: {
            assetReference: "usdt",
            assetOwner: "owner",
            ledgerOpType: "OUT",
            assetSenders: ["owner"],
            assetRecipients: ["other"],
          },
        },
        {
          hash: "tx-hash3",
          extra: {
            assetReference: "usdc",
            assetOwner: "owner",
            ledgerOpType: "IN",
            assetSenders: ["other"],
            assetRecipients: ["owner"],
          },
        },
        {
          hash: "tx-hash4",
          extra: {
            assetReference: "usdt",
            assetOwner: "owner",
            ledgerOpType: "OUT",
            assetSenders: ["owner"],
            assetRecipients: ["other"],
          },
        },
        {
          senders: ["other-as-parent"],
          recipients: ["owner-as-parent"],
          hash: "tx-hash5",
          extra: { assetReference: "usdt", assetOwner: "owner", ledgerOpType: "IN" },
        },
      ] as any,
      getTokenFromAsset: async asset =>
        asset.type === "token" ? ({ id: asset.assetReference } as TokenCurrency) : undefined,
    });

    expect(subAccounts).toMatchObject([
      {
        id: "accountId+usdc",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "usdc" },
        balance: new BigNumber(20),
        spendableBalance: new BigNumber(15),
        operations: [
          {
            id: "accountId+usdc-tx-hash1-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
          },
          {
            id: "accountId+usdc-tx-hash3-IN",
            type: "IN",
            senders: ["other"],
            recipients: ["owner"],
          },
        ],
        operationsCount: 2,
      },
      {
        id: "accountId+usdt",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "usdt" },
        balance: new BigNumber(30),
        spendableBalance: new BigNumber(30),
        operations: [
          {
            id: "accountId+usdt-tx-hash2-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
          },
          {
            id: "accountId+usdt-tx-hash4-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
          },
          {
            id: "accountId+usdt-tx-hash5-IN",
            type: "IN",
            senders: ["other-as-parent"],
            recipients: ["owner-as-parent"],
          },
        ],
        operationsCount: 3,
      },
    ]);
  });

  it.each([
    [
      "blacklisted tokens",
      {
        blacklistedTokenIds: ["other-token"],
        getTokenFromAsset: async (asset: AssetInfo) =>
          asset.type === "token" ? ({ id: asset.assetReference } as TokenCurrency) : undefined,
      },
    ],
    [
      "unknown tokens",
      {
        blacklistedTokenIds: [],
        getTokenFromAsset: async (asset: AssetInfo) =>
          asset.type === "token" && asset.assetReference !== "other-token"
            ? ({ id: asset.assetReference } as TokenCurrency)
            : undefined,
      },
    ],
  ])("does not build accounts from %s", async (_s, config) => {
    const subAccounts = await buildSubAccounts({
      accountId: "accountId",
      allTokenAssetsBalances: [
        {
          value: 20n,
          locked: 5n,
          asset: { type: "token", assetReference: "usdc", assetOwner: "owner" },
        },
        {
          value: 30n,
          asset: { type: "token", assetReference: "other-token", assetOwner: "owner" },
        },
      ],
      syncConfig: { blacklistedTokenIds: config.blacklistedTokenIds } as unknown as SyncConfig,
      operations: [
        {
          hash: "tx-hash1",
          extra: {
            assetReference: "usdc",
            assetOwner: "owner",
            ledgerOpType: "OUT",
            assetSenders: ["owner"],
            assetRecipients: ["other"],
          },
        },
        {
          hash: "tx-hash2",
          extra: {
            assetReference: "other-token",
            assetOwner: "owner",
            ledgerOpType: "OUT",
            assetSenders: ["owner"],
            assetRecipients: ["other"],
          },
        },
        {
          hash: "tx-hash3",
          extra: {
            assetReference: "usdc",
            assetOwner: "owner",
            ledgerOpType: "IN",
            assetSenders: ["other"],
            assetRecipients: ["owner"],
          },
        },
        {
          hash: "tx-hash4",
          extra: {
            assetReference: "other-token",
            assetOwner: "owner",
            ledgerOpType: "OUT",
            assetSenders: ["owner"],
            assetRecipients: ["other"],
          },
        },
        {
          senders: ["other-as-parent"],
          recipients: ["owner-as-parent"],
          hash: "tx-hash5",
          extra: { assetReference: "other-token", assetOwner: "owner", ledgerOpType: "IN" },
        },
      ] as any,
      getTokenFromAsset: config.getTokenFromAsset,
    });

    expect(subAccounts).toMatchObject([
      {
        id: "accountId+usdc",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "usdc" },
        balance: new BigNumber(20),
        spendableBalance: new BigNumber(15),
        operations: [
          {
            id: "accountId+usdc-tx-hash1-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
          },
          {
            id: "accountId+usdc-tx-hash3-IN",
            type: "IN",
            senders: ["other"],
            recipients: ["owner"],
          },
        ],
        operationsCount: 2,
      },
    ]);
  });

  it("matches operations whose assetReference differs only by case from the balance's (Stacks-shaped case)", async () => {
    const subAccounts = await buildSubAccounts({
      accountId: "accountId",
      allTokenAssetsBalances: [
        { value: 20n, asset: { type: "token", assetReference: "usdc", assetOwner: "owner" } },
      ],
      syncConfig: { blacklistedTokenIds: [] } as unknown as SyncConfig,
      operations: [
        // Uppercased on the operation side, lowercase on the balance side -- must still match.
        {
          hash: "tx-hash1",
          extra: {
            assetReference: "USDC",
            assetOwner: "owner",
            ledgerOpType: "IN",
            assetSenders: ["other"],
            assetRecipients: ["owner"],
          },
        },
      ] as any,
      getTokenFromAsset: async asset =>
        asset.type === "token" ? ({ id: asset.assetReference } as TokenCurrency) : undefined,
    });

    expect(subAccounts[0].operations.map(op => op.id)).toEqual(["accountId+usdc-tx-hash1-IN"]);
  });

  it("keeps operations separated by assetOwner when assetReference is otherwise identical", async () => {
    // Identifiers deliberately dash-free: encodeTokenAccountId/encodeOperationId escape "-" in
    // their inputs, which would make asserting on raw id strings fragile here.
    const subAccounts = await buildSubAccounts({
      accountId: "accountId",
      allTokenAssetsBalances: [
        { value: 10n, asset: { type: "token", assetReference: "usdc", assetOwner: "ownerA" } },
        { value: 20n, asset: { type: "token", assetReference: "usdc", assetOwner: "ownerB" } },
      ],
      syncConfig: { blacklistedTokenIds: [] } as unknown as SyncConfig,
      operations: [
        {
          hash: "txHashA",
          extra: {
            assetReference: "usdc",
            assetOwner: "ownerA",
            ledgerOpType: "IN",
            assetSenders: ["other"],
            assetRecipients: ["ownerA"],
          },
        },
        {
          hash: "txHashB",
          extra: {
            assetReference: "usdc",
            assetOwner: "ownerB",
            ledgerOpType: "IN",
            assetSenders: ["other"],
            assetRecipients: ["ownerB"],
          },
        },
      ] as any,
      // Both balances resolve to the same token id (same contract), only assetOwner differs --
      // getTokenFromAsset's own return value can't discriminate them, so this test isolates
      // whether buildSubAccounts routes operations by assetOwner rather than by the resolved token.
      getTokenFromAsset: async asset =>
        asset.type === "token" ? ({ id: `usdc${asset.assetOwner}` } as TokenCurrency) : undefined,
    });

    expect(subAccounts).toHaveLength(2);
    expect(subAccounts.find(sa => sa.token.id === "usdcownerA")?.operations).toMatchObject([
      { hash: "txHashA", senders: ["other"], recipients: ["ownerA"] },
    ]);
    expect(subAccounts.find(sa => sa.token.id === "usdcownerB")?.operations).toMatchObject([
      { hash: "txHashB", senders: ["other"], recipients: ["ownerB"] },
    ]);
  });

  it("falls back to an exact match when either side's assetReference isn't a string", async () => {
    const subAccounts = await buildSubAccounts({
      accountId: "accountId",
      allTokenAssetsBalances: [
        { value: 10n, asset: { type: "token", assetOwner: "owner" } as unknown as AssetInfo },
      ],
      syncConfig: { blacklistedTokenIds: [] } as unknown as SyncConfig,
      operations: [
        { hash: "matches", extra: { assetOwner: "owner", ledgerOpType: "IN" } },
        {
          hash: "does-not-match",
          extra: { assetReference: "some-string", assetOwner: "owner", ledgerOpType: "IN" },
        },
      ] as any,
      getTokenFromAsset: async () => ({ id: "tokenNoRef" }) as TokenCurrency,
    });

    expect(subAccounts[0].operations.map(op => op.id)).toEqual(["accountId+tokenNoRef-matches-IN"]);
  });
});

describe("mergeSubAccounts", () => {
  it("only keeps new sub accounts", () => {
    const oldSubAccounts = [];
    const newSubAccounts = [
      {
        id: "accountId+usdc",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "usdc" },
        balance: new BigNumber(20),
        spendableBalance: new BigNumber(15),
        operations: [
          {
            id: "accountId+usdc-tx-hash1-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
          },
          {
            id: "accountId+usdc-tx-hash3-IN",
            type: "IN",
            senders: ["other"],
            recipients: ["owner"],
          },
        ],
        operationsCount: 2,
      },
      {
        id: "accountId+usdt",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "usdt" },
        balance: new BigNumber(30),
        spendableBalance: new BigNumber(30),
        operations: [
          {
            id: "accountId+usdt-tx-hash2-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
          },
          {
            id: "accountId+usdt-tx-hash4-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
          },
          {
            id: "accountId+usdt-tx-hash5-IN",
            type: "IN",
            senders: ["other-as-parent"],
            recipients: ["owner-as-parent"],
          },
        ],
        operationsCount: 3,
      },
    ] as Array<TokenAccount>;
    const merged = mergeSubAccounts(oldSubAccounts, newSubAccounts);

    expect(merged).toEqual(newSubAccounts);
  });

  it("adds new unexisting sub accounts as is", () => {
    const oldSubAccounts = [
      {
        id: "accountId+usdc",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "usdc" },
        balance: new BigNumber(20),
        spendableBalance: new BigNumber(15),
        operations: [
          {
            id: "accountId+usdc-tx-hash1-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
          },
          {
            id: "accountId+usdc-tx-hash3-IN",
            type: "IN",
            senders: ["other"],
            recipients: ["owner"],
          },
        ],
        operationsCount: 2,
      },
      {
        id: "accountId+usdt",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "usdt" },
        balance: new BigNumber(30),
        spendableBalance: new BigNumber(30),
        operations: [
          {
            id: "accountId+usdt-tx-hash2-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
          },
          {
            id: "accountId+usdt-tx-hash4-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
          },
          {
            id: "accountId+usdt-tx-hash5-IN",
            type: "IN",
            senders: ["other-as-parent"],
            recipients: ["owner-as-parent"],
          },
        ],
        operationsCount: 3,
      },
    ] as Array<TokenAccount>;
    const newSubAccounts = [
      {
        id: "accountId+other-token",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "other-token" },
        balance: new BigNumber(20),
        spendableBalance: new BigNumber(20),
        operations: [
          {
            id: "accountId+other-token-tx-hash6-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
          },
          {
            id: "accountId+other-token-tx-hash7-IN",
            type: "IN",
            senders: ["other"],
            recipients: ["owner"],
          },
        ],
        operationsCount: 2,
      },
    ] as Array<TokenAccount>;
    const merged = mergeSubAccounts(oldSubAccounts, newSubAccounts);

    expect(merged).toEqual([...oldSubAccounts, ...newSubAccounts]);
  });

  it("updates existing sub accounts with new data", () => {
    const oldSubAccounts = [
      {
        id: "accountId+usdc",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "usdc" },
        balance: new BigNumber(20),
        spendableBalance: new BigNumber(15),
        operations: [
          {
            id: "accountId+usdc-tx-hash1-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
            date: new Date("2019-04-01"),
          },
          {
            id: "accountId+usdc-tx-hash3-IN",
            type: "IN",
            senders: ["other"],
            recipients: ["owner"],
            date: new Date("2019-04-02"),
          },
        ],
        operationsCount: 2,
      },
      {
        id: "accountId+usdt",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "usdt" },
        balance: new BigNumber(30),
        spendableBalance: new BigNumber(30),
        operations: [
          {
            id: "accountId+usdt-tx-hash2-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
            date: new Date("2019-04-02"),
          },
          {
            id: "accountId+usdt-tx-hash4-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
            date: new Date("2019-04-02"),
          },
          {
            id: "accountId+usdt-tx-hash5-IN",
            type: "IN",
            senders: ["other-as-parent"],
            recipients: ["owner-as-parent"],
            date: new Date("2019-04-03"),
          },
        ],
        operationsCount: 3,
      },
    ] as Array<TokenAccount>;
    const newSubAccounts = [
      {
        id: "accountId+usdt",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "usdt" },
        balance: new BigNumber(20),
        spendableBalance: new BigNumber(20),
        operations: [
          {
            id: "accountId+usdt-tx-hash6-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
            date: new Date("2019-04-04"),
          },
        ],
        operationsCount: 1,
      },
    ] as Array<TokenAccount>;
    const merged = mergeSubAccounts(oldSubAccounts, newSubAccounts);

    expect(merged).toEqual([
      {
        id: "accountId+usdc",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "usdc" },
        balance: new BigNumber(20),
        spendableBalance: new BigNumber(15),
        operations: [
          {
            id: "accountId+usdc-tx-hash1-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
            date: new Date("2019-04-01"),
          },
          {
            id: "accountId+usdc-tx-hash3-IN",
            type: "IN",
            senders: ["other"],
            recipients: ["owner"],
            date: new Date("2019-04-02"),
          },
        ],
        operationsCount: 2,
      },
      {
        id: "accountId+usdt",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "usdt" },
        balance: new BigNumber(20),
        spendableBalance: new BigNumber(20),
        operations: [
          {
            id: "accountId+usdt-tx-hash6-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
            date: new Date("2019-04-04"),
          },
          {
            id: "accountId+usdt-tx-hash2-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
            date: new Date("2019-04-02"),
          },
          {
            id: "accountId+usdt-tx-hash4-OUT",
            type: "OUT",
            senders: ["owner"],
            recipients: ["other"],
            date: new Date("2019-04-02"),
          },
          {
            id: "accountId+usdt-tx-hash5-IN",
            type: "IN",
            senders: ["other-as-parent"],
            recipients: ["owner-as-parent"],
            date: new Date("2019-04-03"),
          },
        ],
        operationsCount: 4,
      },
    ]);
  });

  it("prevents duplicates when token account ID changes but token.id stays the same", () => {
    const oldSubAccounts = [
      {
        id: "accountId+stellar:USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        type: "TokenAccount",
        parentId: "accountId",
        token: {
          id: "stellar/asset/USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        },
        balance: new BigNumber(100),
        spendableBalance: new BigNumber(100),
        operations: [
          {
            id: "old-op-1",
            type: "IN",
            senders: ["sender1"],
            recipients: ["owner"],
            date: new Date("2019-01-01"),
          },
          {
            id: "old-op-2",
            type: "OUT",
            senders: ["owner"],
            recipients: ["recipient1"],
            date: new Date("2019-01-02"),
          },
        ],
        operationsCount: 2,
      },
    ] as Array<TokenAccount>;

    const newSubAccounts = [
      {
        id: "accountId+stellar/asset/USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        type: "TokenAccount",
        parentId: "accountId",
        token: {
          id: "stellar/asset/USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        },
        balance: new BigNumber(150),
        spendableBalance: new BigNumber(150),
        operations: [
          {
            id: "new-op-1",
            type: "IN",
            senders: ["sender2"],
            recipients: ["owner"],
            date: new Date("2019-01-03"),
          },
        ],
        operationsCount: 1,
      },
    ] as Array<TokenAccount>;

    const merged = mergeSubAccounts(oldSubAccounts, newSubAccounts);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      token: { id: "stellar/asset/USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
      balance: new BigNumber(150),
      spendableBalance: new BigNumber(150),
      operationsCount: 3,
    });
    expect(merged[0].operations).toHaveLength(3);
  });

  describe("with an operation-history bound", () => {
    const tokenAccount = (
      id: string,
      operations: Array<{ id: string; date: Date }>,
    ): TokenAccount =>
      ({
        id: `accountId+${id}`,
        type: "TokenAccount",
        parentId: "accountId",
        token: { id },
        balance: new BigNumber(100),
        spendableBalance: new BigNumber(100),
        operations: operations.map(op => ({ ...op, type: "IN", senders: [], recipients: [] })),
        operationsCount: operations.length,
      }) as unknown as TokenAccount;

    it("caps the merged operations to the bound, keeping the newest (mergeOps is newest-first)", () => {
      const oldSubAccounts = [
        tokenAccount("usdc", [
          { id: "old-1", date: new Date("2024-01-01") },
          { id: "old-2", date: new Date("2024-01-02") },
          { id: "old-3", date: new Date("2024-01-03") },
        ]),
      ];
      const newSubAccounts = [
        tokenAccount("usdc", [
          { id: "new-1", date: new Date("2024-01-10") },
          { id: "new-2", date: new Date("2024-01-11") },
        ]),
      ];

      // 5 operations merged, bounded to 2: only the two most recent survive.
      const merged = mergeSubAccounts(oldSubAccounts, newSubAccounts, 2);

      expect(merged[0].operations.map(op => op.id)).toEqual(["new-2", "new-1"]);
      expect(merged[0].operationsCount).toBe(2);
    });

    it("does not shrink the merged operations below the bound when there are fewer than the bound", () => {
      const oldSubAccounts = [
        tokenAccount("usdc", [{ id: "old-1", date: new Date("2024-01-01") }]),
      ];
      const newSubAccounts = [
        tokenAccount("usdc", [{ id: "new-1", date: new Date("2024-01-10") }]),
      ];

      const merged = mergeSubAccounts(oldSubAccounts, newSubAccounts, 10);

      expect(merged[0].operations.map(op => op.id)).toEqual(["new-1", "old-1"]);
      expect(merged[0].operationsCount).toBe(2);
    });

    it("stays stable across repeated merges: the retained count never exceeds the bound", () => {
      // Newest-first, matching mergeOps's own precondition on `existing` -- the real caller always
      // hands it a previously-merged (and, at the very start, freshly-paginated `order: "desc"`)
      // list, never an arbitrarily-ordered one.
      let subAccounts = [
        tokenAccount("usdc", [
          { id: "gen1-b", date: new Date("2024-01-02") },
          { id: "gen1-a", date: new Date("2024-01-01") },
        ]),
      ];

      // Three more "syncs", each contributing new operations -- the parent-level equivalent of
      // this is the dedicated stability test in getAccountShape.test.ts.
      for (const [i, date] of [
        new Date("2024-02-01"),
        new Date("2024-03-01"),
        new Date("2024-04-01"),
      ].entries()) {
        const freshSubAccounts = [tokenAccount("usdc", [{ id: `gen${i + 2}`, date }])];
        subAccounts = mergeSubAccounts(subAccounts, freshSubAccounts, 3);
        expect(subAccounts[0].operations.length).toBeLessThanOrEqual(3);
        expect(subAccounts[0].operationsCount).toBe(subAccounts[0].operations.length);
      }

      // Newest three survive: the two oldest (gen1-a, gen1-b) were dropped first.
      expect(subAccounts[0].operations.map(op => op.id)).toEqual(["gen4", "gen3", "gen2"]);
    });

    it("does not bound a brand-new sub account's operations (already walk-bounded upstream)", () => {
      const newSubAccounts = [
        tokenAccount("usdc", [
          { id: "op-1", date: new Date("2024-01-01") },
          { id: "op-2", date: new Date("2024-01-02") },
        ]),
      ];

      const merged = mergeSubAccounts([], newSubAccounts, 1);

      expect(merged).toBe(newSubAccounts);
    });

    it("is unbounded when maxOperations is undefined, identical to today's behaviour", () => {
      const oldSubAccounts = [
        tokenAccount("usdc", [{ id: "old-1", date: new Date("2024-01-01") }]),
      ];
      const newSubAccounts = [
        tokenAccount("usdc", [{ id: "new-1", date: new Date("2024-01-10") }]),
      ];

      const mergedWithoutBound = mergeSubAccounts(oldSubAccounts, newSubAccounts);
      const mergedWithUndefinedBound = mergeSubAccounts(oldSubAccounts, newSubAccounts, undefined);

      expect(mergedWithoutBound[0].operations.map(op => op.id)).toEqual(["new-1", "old-1"]);
      expect(mergedWithUndefinedBound[0].operations.map(op => op.id)).toEqual(["new-1", "old-1"]);
    });
  });
});
