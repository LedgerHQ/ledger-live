import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { buildSubAccounts, mergeSubAccounts } from "./buildSubAccounts";
import { SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { AssetInfo } from "@ledgerhq/coin-framework/api/types";

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
});
