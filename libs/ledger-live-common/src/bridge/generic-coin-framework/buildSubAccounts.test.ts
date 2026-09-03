import { TokenCurrency } from "@domain/entity-currency-token";
import { buildSubAccounts, mergeSubAccounts } from "./buildSubAccounts";
import { SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/types";

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

describe("buildSubAccounts family shapes", () => {
  const balances: Balance[] = [
    { value: 20n, asset: { type: "token", assetReference: "usdc", assetOwner: "owner" } },
    { value: 30n, asset: { type: "token", assetReference: "usdt", assetOwner: "owner" } },
  ];

  const build = (familyShapes?: Record<string, Record<string, unknown>>) =>
    buildSubAccounts({
      accountId: "accountId",
      allTokenAssetsBalances: balances,
      syncConfig: { blacklistedTokenIds: [] } as unknown as SyncConfig,
      operations: [],
      getTokenFromAsset: async asset =>
        asset.type === "token"
          ? ({ id: asset.assetReference, contractAddress: asset.assetReference } as TokenCurrency)
          : undefined,
      familyShapes,
    });

  it("puts the family fields on the sub account they belong to", async () => {
    const subAccounts = await build({ usdc: { state: "frozen" } });

    expect(subAccounts[0]).toMatchObject({ id: expect.any(String), state: "frozen" });
    expect(subAccounts[1]).not.toHaveProperty("state");
  });

  it("leaves the accounts untouched when the family contributes nothing", async () => {
    const subAccounts = await build();

    expect(subAccounts).toHaveLength(2);
    expect(subAccounts[0]).not.toHaveProperty("state");
  });

  // The framework owns the account's identity; a family cannot rename it.
  it("cannot overwrite a framework field", async () => {
    const subAccounts = await build({ usdc: { id: "hijacked", balance: new BigNumber(999) } });

    expect(subAccounts[0].id).not.toBe("hijacked");
    expect(subAccounts[0].balance).toEqual(new BigNumber(20));
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

  // Solana's sub-account ids predate the framework and carry the token account's address, so the
  // stored id and the one `buildTokenAccount` derives differ. The stored one wins, and the freshly
  // built operations must follow it.
  it("re-keys incoming operations onto the stored sub account id when the two differ", () => {
    const oldSubAccounts = [
      {
        id: "accountId+ataAddress",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "usdc" },
        balance: new BigNumber(10),
        spendableBalance: new BigNumber(10),
        operations: [],
        operationsCount: 0,
      },
    ] as unknown as Array<TokenAccount>;
    const newSubAccounts = [
      {
        id: "accountId+usdc",
        type: "TokenAccount",
        parentId: "accountId",
        token: { id: "usdc" },
        balance: new BigNumber(20),
        spendableBalance: new BigNumber(20),
        operations: [
          {
            id: "accountId+usdc-hash1-OUT",
            accountId: "accountId+usdc",
            hash: "hash1",
            type: "OUT",
            date: new Date("2019-04-04"),
          },
        ],
        operationsCount: 1,
      },
    ] as unknown as Array<TokenAccount>;

    const [merged] = mergeSubAccounts(oldSubAccounts, newSubAccounts);

    expect(merged.id).toBe("accountId+ataAddress");
    expect(merged.operations[0]).toMatchObject({
      accountId: "accountId+ataAddress",
      id: "accountId+ataAddress-hash1-OUT",
    });
  });
});
