import coinConfig, { type TezosCoinConfig } from "../config";
import { listOperations } from "./listOperations";

/**
 * Mainnet integration tests for listOperations with FA2 (USDt) token transfers.
 * Uses a dedicated account holding FA2 USDt (tokenId 0) — see TzKT for current balance.
 *
 * Explorer: https://xtz-tzkt-explorer.api.vault.ledger.com (Ledger vault)
 */

const ADDRESS = "tz1UD2zz5eFTW2Jy26kBnC3ZkdeazUgeFWST";
/** FA2 USDt contract for this account on mainnet (TzKT). */
const USDT_FA2_CONTRACT = "KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o";
/** Expected assetReference after the LIVE-30344 fix: contract:tokenId. USDt tokenId is 0. */
const USDT_FA2_ASSET_REF = `${USDT_FA2_CONTRACT}:0`;
const KT1_ASSET_REF_PATTERN = /^KT1[1-9A-HJ-NP-Za-km-z]+:\d+$/;

const mainnetConfig = (): TezosCoinConfig =>
  ({
    status: { type: "active" },
    baker: { url: "https://tezos-bakers.api.live.ledger.com" },
    explorer: { url: "https://xtz-tzkt-explorer.api.vault.ledger.com", maxTxQuery: 100 },
    node: { url: "https://xtz-node.api.vault.ledger.com" },
    fees: {
      minGasLimit: 0,
      minRevealGasLimit: 0,
      minStorageLimit: 0,
      minFees: 0,
      minEstimatedFees: 0,
    },
  }) as TezosCoinConfig;

const baseOpts = { sort: "Descending" as const, minHeight: 0 };

describe("listOperations — mainnet FA2 / convertTokenOperation", () => {
  let originalGetCoinConfig: () => TezosCoinConfig;

  beforeAll(() => {
    originalGetCoinConfig = coinConfig.getCoinConfig;
    coinConfig.setCoinConfig(mainnetConfig);
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  it("returns at least one FA2 token operation", async () => {
    const [operations] = await listOperations(ADDRESS, baseOpts);
    expect(operations.some(op => op.asset.type === "fa2")).toBe(true);
  });

  it("maps FA2 token operations via convertTokenOperation (shape)", async () => {
    const [operations] = await listOperations(ADDRESS, { ...baseOpts, limit: 200 });
    const fa2 = operations.find(op => {
      if (op.asset.type !== "fa2") return false;
      return op.asset.assetReference === USDT_FA2_ASSET_REF;
    });

    const tokenOp = fa2!;
    expect(tokenOp.asset.type).toBe("fa2");
    if (tokenOp.asset.type !== "fa2") {
      throw new Error("expected FA2 operation");
    }
    const asset = tokenOp.asset;

    expect(asset).toMatchObject({
      type: "fa2",
      assetOwner: ADDRESS,
    });
    expect(asset.assetReference).toMatch(KT1_ASSET_REF_PATTERN);
    expect(asset.assetReference).toBe(USDT_FA2_ASSET_REF);
    const unit = asset.unit!;
    expect(typeof unit.magnitude).toBe("number");
    expect(unit.magnitude).toBeGreaterThanOrEqual(0);
    expect(typeof unit.code).toBe("string");
    // TzKT sometimes omits metadata; when decimals are present they should be 6 for USDt.
    if (unit.magnitude > 0) {
      expect(unit.magnitude).toBe(6);
      expect(unit.code).toMatch(/USDt|USDT/i);
    }
    expect(["IN", "OUT", "FEES"]).toContain(tokenOp.type);
    expect(tokenOp.value).toBeGreaterThanOrEqual(0n);
    expect(tokenOp.tx.hash).toMatch(/^o[1-9A-HJ-NP-Za-km-z]+/);
    expect(tokenOp.tx.block.hash).toMatch(/^B[1-9A-HJ-NP-Za-km-z]+/);
    expect(tokenOp.tx.block.height).toBeGreaterThan(0);
    expect(tokenOp.tx.date).toBeInstanceOf(Date);
    const idParts = tokenOp.id.match(/^(.+)-token-(\d+)$/);
    expect(idParts).not.toBeNull();
    expect(idParts![1]).toBe(tokenOp.tx.hash);
    expect(Number.parseInt(idParts![2], 10)).toBeGreaterThanOrEqual(0);
  });

  it("infers direction: OUT when sending, IN when receiving (FA2)", async () => {
    const [operations] = await listOperations(ADDRESS, { ...baseOpts, limit: 200 });
    const fa2Ops = operations.filter(op => op.asset.type === "fa2");

    for (const op of fa2Ops) {
      const isSender = op.senders.includes(ADDRESS);
      const isRecipient = op.recipients.includes(ADDRESS);

      if (isSender && !isRecipient) {
        expect(op.type).toBe("OUT");
      }
      if (isRecipient && !isSender) {
        expect(op.type).toBe("IN");
      }
      if (isSender && isRecipient) {
        expect(op.type).toBe("FEES");
      }
    }
  });

  it("attributes fees from parent native transaction when resolvable (FA2)", async () => {
    const [operations] = await listOperations(ADDRESS, { ...baseOpts, limit: 200 });
    const fa2Ops = operations.filter(op => op.asset.type === "fa2");

    for (const op of fa2Ops) {
      expect(op.tx.fees).toBeGreaterThanOrEqual(0n);
    }

    // Parent tx is joined only when it appears in `getAccountOperations` for this address;
    // otherwise fees stay 0 and parent* details are empty.
    const withParentHint = fa2Ops.filter(op => {
      const parentSenders = op.details?.parentSenders;
      const parentRecipients = op.details?.parentRecipients;
      return (
        (Array.isArray(parentSenders) && parentSenders.length > 0) ||
        (Array.isArray(parentRecipients) && parentRecipients.length > 0)
      );
    });
    for (const op of withParentHint) {
      expect(op.tx.fees).toBeGreaterThan(0n);
      if (op.tx.feesPayer !== undefined) {
        expect(op.tx.feesPayer).toMatch(/^tz[123][1-9A-HJ-NP-Za-km-z]+$/);
      }
    }
  });

  it("exposes convertTokenOperation details for FA2", async () => {
    const [operations] = await listOperations(ADDRESS, baseOpts);
    const fa2 = operations.find(op => op.asset.type === "fa2");

    const conversionDetails = fa2!.details!;
    expect(typeof conversionDetails.assetAmount).toBe("string");
    expect(Array.isArray(conversionDetails.assetSenders)).toBe(true);
    expect(Array.isArray(conversionDetails.assetRecipients)).toBe(true);
    expect(Array.isArray(conversionDetails.parentSenders)).toBe(true);
    expect(Array.isArray(conversionDetails.parentRecipients)).toBe(true);
  });

  it("returns a pagination cursor with lastLevel boundary", async () => {
    const [, nextToken] = await listOperations(ADDRESS, { ...baseOpts, limit: 3 });
    expect(nextToken.length).toBeGreaterThan(0);

    const parsed: unknown = JSON.parse(nextToken);
    expect(parsed).toEqual(
      expect.objectContaining({
        lastLevel: expect.any(Number),
      }),
    );
  });

  it("pagination returns disjoint operation ids across pages", async () => {
    const limit = 3;
    const [page1, cursor] = await listOperations(ADDRESS, { ...baseOpts, limit });
    expect(cursor.length).toBeGreaterThan(0);

    const [page2] = await listOperations(ADDRESS, { ...baseOpts, limit, token: cursor });

    const ids1 = new Set(page1.map(op => op.id));
    const overlap = page2.filter(op => ids1.has(op.id));
    expect(overlap).toHaveLength(0);
  });

  it("second page accepts cursor with lastLevel for both streams", async () => {
    const limit = 3;
    const [, cursor] = await listOperations(ADDRESS, { ...baseOpts, limit });
    expect(cursor.length).toBeGreaterThan(0);

    const parsed: unknown = JSON.parse(cursor);
    expect(parsed).toEqual(
      expect.objectContaining({
        lastLevel: expect.any(Number),
      }),
    );

    await expect(
      listOperations(ADDRESS, { ...baseOpts, limit, token: cursor }),
    ).resolves.toBeDefined();
  });

  it("does not split the same tx.hash across consecutive pages (limit 3)", async () => {
    const limit = 3;
    const [page1, cursor] = await listOperations(ADDRESS, { ...baseOpts, limit });
    if (cursor.length === 0) {
      return;
    }
    const [page2] = await listOperations(ADDRESS, { ...baseOpts, limit, token: cursor });
    const hashesPage1 = new Set(page1.map(op => op.tx.hash));
    const hashesPage2 = new Set(page2.map(op => op.tx.hash));
    const overlap = [...hashesPage1].filter(h => hashesPage2.has(h));
    expect(overlap).toHaveLength(0);
  });

  it("does not duplicate operation ids within the first page", async () => {
    const [operations] = await listOperations(ADDRESS, { ...baseOpts, limit: 100 });
    const ids = operations.map(op => op.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// Shadownet test address `tz1dKrT1…` was funded via faucet and put through:
// delegate to TF Test Baker, stake 500 XTZ, unstake 250 XTZ, then
// finalize_unstake (paid by a helper account, after ~2 cycles ≈ 48h).
const SHADOWNET_STAKER = "tz1dKrT1h6d7wP8fEzMPptG6er7mLLeQjBBY";
const SHADOWNET_BAKER = "tz3Q67aMz7gSMiQRcW729sXSfuMtkyAHYfqc";

const shadownetConfig = (): TezosCoinConfig =>
  ({
    status: { type: "active" },
    baker: { url: "https://tezos-bakers.api.live.ledger.com" },
    explorer: { url: "https://api.shadownet.tzkt.io", maxTxQuery: 100 },
    node: { url: "https://rpc.shadownet.teztnets.com" },
    fees: {
      minGasLimit: 0,
      minRevealGasLimit: 0,
      minStorageLimit: 0,
      minFees: 0,
      minEstimatedFees: 0,
    },
  }) as TezosCoinConfig;

// To refresh: TzKT `/v1/operations/staking?sender=…` + `/v1/blocks/{level}`.
const EXPECTED_STAKE = {
  id: "ooyKCZtF84XchfEr5fjiQV5BEEBjKSCjhKW7xyY4o763yj27mLs-96147000524800",
  asset: { type: "native" },
  tx: {
    hash: "ooyKCZtF84XchfEr5fjiQV5BEEBjKSCjhKW7xyY4o763yj27mLs",
    fees: 797n,
    feesPayer: SHADOWNET_STAKER,
    block: {
      hash: "BLa8cr5yFHqozjAzEnkvKQmaDmAxeurBBGvZqdibmzCiYmR6r6L",
      height: 3106279,
      time: new Date("2026-04-28T20:51:21Z"),
    },
    date: new Date("2026-04-28T20:51:21Z"),
    failed: false,
  },
  type: "STAKE",
  value: 500_000_000n,
  senders: [SHADOWNET_STAKER],
  recipients: [SHADOWNET_BAKER],
  details: {
    counter: 14416505,
    gasLimit: 3630,
    storageLimit: 0,
    ledgerOpType: "STAKE",
  },
};

const EXPECTED_UNSTAKE = {
  id: "ooXrdBW4aY3613YkmsX4uzdidqUTM2Gw7cFZ7aU6irwQ6TmLeFS-96148169687040",
  asset: { type: "native" },
  tx: {
    hash: "ooXrdBW4aY3613YkmsX4uzdidqUTM2Gw7cFZ7aU6irwQ6TmLeFS",
    fees: 858n,
    feesPayer: SHADOWNET_STAKER,
    block: {
      hash: "BLMaHTGtBfh7ZM2wk5rpFHQhNtx5LC7YMdYrnokzBcosrpgqNAe",
      height: 3106307,
      time: new Date("2026-04-28T20:54:09Z"),
    },
    date: new Date("2026-04-28T20:54:09Z"),
    failed: false,
  },
  type: "UNSTAKE",
  value: 250_000_000n,
  senders: [SHADOWNET_STAKER],
  recipients: [SHADOWNET_BAKER],
  details: {
    counter: 14416506,
    gasLimit: 4250,
    storageLimit: 0,
    ledgerOpType: "UNSTAKE",
  },
};

const FINALIZE_FEES_PAYER = "tz1i92Eptw7UZ8JSb8j8jBFJ9Poa4TTnSQwZ";
const EXPECTED_FINALIZE_UNSTAKE = {
  id: "oodrjyZyoyccgoE24BbMsxfSY4JnP6nrZpmw2xqzurQb7QW3HBD-98214102433792",
  asset: { type: "native" },
  tx: {
    hash: "oodrjyZyoyccgoE24BbMsxfSY4JnP6nrZpmw2xqzurQb7QW3HBD",
    fees: 492n,
    feesPayer: FINALIZE_FEES_PAYER,
    block: {
      hash: "BLvjbzKJ5cQfmncDt3CiKcuKpk87pP34t6rmm6FWE9iCFbJb1Xp",
      height: 3153614,
      time: new Date("2026-05-02T03:50:54Z"),
    },
    date: new Date("2026-05-02T03:50:54Z"),
    failed: false,
  },
  type: "FINALIZE_UNSTAKE",
  value: 250_000_000n,
  senders: [SHADOWNET_BAKER],
  recipients: [SHADOWNET_STAKER],
  details: {
    counter: 801846,
    gasLimit: 2169,
    storageLimit: 0,
    ledgerOpType: "FINALIZE_UNSTAKE",
  },
};

describe("listOperations — Shadownet Paris staking ops", () => {
  let originalGetCoinConfig: () => TezosCoinConfig;

  beforeAll(() => {
    originalGetCoinConfig = coinConfig.getCoinConfig;
    coinConfig.setCoinConfig(shadownetConfig);
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  it.each([
    ["STAKE", EXPECTED_STAKE],
    ["UNSTAKE", EXPECTED_UNSTAKE],
    ["FINALIZE_UNSTAKE", EXPECTED_FINALIZE_UNSTAKE],
  ])("contains a %s op matching every field of the pinned fixture", async (type, expected) => {
    const [operations] = await listOperations(SHADOWNET_STAKER, { ...baseOpts, limit: 100 });
    const match = operations.find(op => op.type === type);
    if (!match) throw new Error(`No ${type} op found at ${SHADOWNET_STAKER}`);

    expect(match).toEqual(expected);
  });
});

describe("listOperations — mainnet origination ops", () => {
  // This account deployed 4 contracts — origination ops were previously silently dropped.
  const ORIGINATOR = "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb";

  let originalGetCoinConfig: () => TezosCoinConfig;

  beforeAll(() => {
    originalGetCoinConfig = coinConfig.getCoinConfig;
    coinConfig.setCoinConfig(mainnetConfig);
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  it("surfaces origination operations with correct fees and ledgerOpType", async () => {
    // Fetch with a high limit to get all ops in one page (account has ~234 ops)
    const [operations] = await listOperations(ORIGINATOR, {
      sort: "Ascending",
      minHeight: 0,
      limit: 500,
    });

    const originations = operations.filter(op => op.details?.ledgerOpType === "ORIGINATION");
    expect(originations.length).toBeGreaterThanOrEqual(4);
    for (const op of originations) {
      expect(op.type).toBe("FEES");
      expect(op.value).toBe(0n);
      expect(op.tx.fees).toBeGreaterThan(0n);
      expect(op.tx.feesPayer).toBe(ORIGINATOR);
      expect(op.senders).toContain(ORIGINATOR);
    }

    // Total origination fees should be at least the known historical balance gap (~5.48M mutez)
    const totalFees = originations.reduce((sum, op) => sum + op.tx.fees, 0n);
    expect(totalFees).toBeGreaterThanOrEqual(5_480_510n);
  });
});
