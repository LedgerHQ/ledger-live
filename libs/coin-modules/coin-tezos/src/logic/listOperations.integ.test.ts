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
const KT1_PATTERN = /^KT1[1-9A-HJ-NP-Za-km-z]+$/;

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
      return op.asset.assetReference === USDT_FA2_CONTRACT;
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
    expect(asset.assetReference).toMatch(KT1_PATTERN);
    expect(asset.assetReference).toBe(USDT_FA2_CONTRACT);
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

  it("returns a pagination cursor with native and token last ids", async () => {
    const [, nextToken] = await listOperations(ADDRESS, { ...baseOpts, limit: 20 });
    expect(nextToken.length).toBeGreaterThan(0);

    const parsed: unknown = JSON.parse(nextToken);
    expect(parsed).toEqual(
      expect.objectContaining({
        nativeLastId: expect.anything(),
        tokenLastId: expect.anything(),
      }),
    );
    const { nativeLastId, tokenLastId } = parsed as {
      nativeLastId?: unknown;
      tokenLastId?: unknown;
    };
    expect(nativeLastId === undefined || typeof nativeLastId === "number").toBe(true);
    expect(tokenLastId === undefined || typeof tokenLastId === "number").toBe(true);
    expect(nativeLastId !== undefined || tokenLastId !== undefined).toBe(true);
  });

  it("pagination returns disjoint operation ids across pages", async () => {
    const limit = 10;
    const [page1, cursor] = await listOperations(ADDRESS, { ...baseOpts, limit });
    expect(cursor.length).toBeGreaterThan(0);

    const [page2] = await listOperations(ADDRESS, { ...baseOpts, limit, token: cursor });

    const ids1 = new Set(page1.map(op => op.id));
    const overlap = page2.filter(op => ids1.has(op.id));
    expect(overlap).toHaveLength(0);
  });

  it("second page uses tokenLastId from cursor for token transfer pagination", async () => {
    const limit = 30;
    const [, cursor] = await listOperations(ADDRESS, { ...baseOpts, limit });
    expect(cursor.length).toBeGreaterThan(0);

    const parsed: unknown = JSON.parse(cursor);
    expect(parsed).toEqual(
      expect.objectContaining({
        tokenLastId: expect.any(Number),
      }),
    );

    await expect(
      listOperations(ADDRESS, { ...baseOpts, limit, token: cursor }),
    ).resolves.toBeDefined();
  });

  it("does not duplicate operation ids within the first page", async () => {
    const [operations] = await listOperations(ADDRESS, { ...baseOpts, limit: 100 });
    const ids = operations.map(op => op.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
