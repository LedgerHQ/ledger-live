import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { fromOperationRaw, toOperationRaw } from "@ledgerhq/ledger-wallet-framework/serialization";
import { getAccountRawAssignHooks } from "../accountRawAssign";

const loadAccountRawAssignForFamilyMock = jest.fn();

jest.mock("../../../coin-modules/registry", () => ({
  loadAccountRawAssignForFamily: (...args: unknown[]) => loadAccountRawAssignForFamilyMock(...args),
}));

describe("getAccountRawAssignHooks — operation extra serialization", () => {
  beforeEach(() => jest.clearAllMocks());

  it("keeps the framework-owned keys a family hook does not map", async () => {
    // The serialization layer replaces `extra` wholesale, so without the framework's own half a
    // family mapping only `frozenAmount` would lose `ledgerOpType` and `memo` on every restore.
    loadAccountRawAssignForFamilyMock.mockResolvedValue({
      fromOperationExtraRaw: (extraRaw: any) => ({
        frozenAmount: new BigNumber(extraRaw.frozenAmount),
      }),
    });

    const { fromOperationExtraRaw } = await getAccountRawAssignHooks("tron");
    const revived = fromOperationExtraRaw!({
      ledgerOpType: "FREEZE",
      memo: "hello",
      frozenAmount: "1000000",
    }) as any;

    expect(revived.ledgerOpType).toBe("FREEZE");
    expect(revived.memo).toBe("hello");
    expect(revived.frozenAmount).toEqual(new BigNumber(1_000_000));
  });

  it("serializes the framework's own stake amount and revives it", async () => {
    loadAccountRawAssignForFamilyMock.mockResolvedValue({
      fromOperationExtraRaw: () => ({}),
      toOperationExtraRaw: () => ({}),
    });

    const { fromOperationExtraRaw, toOperationExtraRaw } = await getAccountRawAssignHooks("tron");

    const raw = toOperationExtraRaw!({
      stake: { address: "validator", amount: new BigNumber(2_500) },
    }) as any;
    expect(raw.stake).toEqual({ address: "validator", amount: "2500" });

    const revived = fromOperationExtraRaw!(raw) as any;
    expect(revived.stake.amount).toEqual(new BigNumber(2_500));
  });

  it("lets the family's own mapping win over the framework passthrough", async () => {
    loadAccountRawAssignForFamilyMock.mockResolvedValue({
      toOperationExtraRaw: (extra: any) => ({ frozenAmount: extra.frozenAmount.toFixed() }),
    });

    const { toOperationExtraRaw } = await getAccountRawAssignHooks("tron");
    const raw = toOperationExtraRaw!({ frozenAmount: new BigNumber(42), memo: "kept" }) as any;

    expect(raw.frozenAmount).toBe("42");
    expect(raw.memo).toBe("kept");
  });

  it("keeps the framework half when a family hook returns nothing usable", async () => {
    loadAccountRawAssignForFamilyMock.mockResolvedValue({
      toOperationExtraRaw: () => undefined,
    });

    const { toOperationExtraRaw } = await getAccountRawAssignHooks("tron");
    const raw = toOperationExtraRaw!({
      ledgerOpType: "FREEZE",
      stake: { address: "validator", amount: new BigNumber(7) },
    }) as any;

    expect(raw.ledgerOpType).toBe("FREEZE");
    expect(raw.stake).toEqual({ address: "validator", amount: "7" });
  });

  it("converts the framework's stake even when the family hook spreads the whole bag", async () => {
    loadAccountRawAssignForFamilyMock.mockResolvedValue({
      toOperationExtraRaw: (extra: any) => ({
        ...extra,
        frozenAmount: extra.frozenAmount.toFixed(),
      }),
    });

    const { toOperationExtraRaw } = await getAccountRawAssignHooks("tron");
    const raw = toOperationExtraRaw!({
      frozenAmount: new BigNumber(42),
      stake: { address: "validator", amount: new BigNumber(2_500) },
    }) as any;

    expect(raw.frozenAmount).toBe("42");
    expect(raw.stake).toEqual({ address: "validator", amount: "2500" });
  });

  it("converts both directions when the family declares only one", async () => {
    loadAccountRawAssignForFamilyMock.mockResolvedValue({
      toOperationExtraRaw: (extra: any) => extra,
    });

    const { fromOperationExtraRaw } = await getAccountRawAssignHooks("tron");

    expect(fromOperationExtraRaw).toBeDefined();
    const revived = fromOperationExtraRaw!({
      stake: { address: "validator", amount: "2500" },
    }) as any;
    expect(revived.stake.amount).toEqual(new BigNumber(2_500));
  });

  it("declares no hook when the family declares none", async () => {
    // `toOperationRaw` gates on the hook being present and persists `extra` verbatim otherwise, so
    // wrapping unconditionally would change how every already-migrated family serializes.
    loadAccountRawAssignForFamilyMock.mockResolvedValue({ assignFromAccountRaw: jest.fn() });

    const hooks = await getAccountRawAssignHooks("evm");

    expect(hooks.fromOperationExtraRaw).toBeUndefined();
    expect(hooks.toOperationExtraRaw).toBeUndefined();
  });
});

describe("getAccountRawAssignHooks — round trip through the serialization layer", () => {
  beforeEach(() => jest.clearAllMocks());

  function baseOperation(extra: Record<string, unknown>): Operation {
    return {
      id: "accId_hash_OUT",
      hash: "hash",
      type: "OUT",
      senders: ["s"],
      recipients: ["r"],
      accountId: "accId",
      blockHash: "bh",
      blockHeight: 1,
      date: new Date("2026-01-01"),
      value: new BigNumber(1),
      fee: new BigNumber(1),
      extra,
    } as Operation;
  }

  it("keeps framework keys and converts stake.amount while a family maps only its own key", async () => {
    loadAccountRawAssignForFamilyMock.mockResolvedValue({
      toOperationExtraRaw: (extra: any) => ({ frozenAmount: extra.frozenAmount.toFixed() }),
      fromOperationExtraRaw: (raw: any) => ({ frozenAmount: new BigNumber(raw.frozenAmount) }),
    });
    const { toOperationExtraRaw, fromOperationExtraRaw } = await getAccountRawAssignHooks("tron");

    const op = baseOperation({
      ledgerOpType: "FREEZE",
      memo: "hi",
      frozenAmount: new BigNumber(1000),
      stake: { address: "v", amount: new BigNumber(2500) },
    });

    const raw = toOperationRaw(op, undefined, toOperationExtraRaw);
    expect(raw.extra.ledgerOpType).toBe("FREEZE");
    expect(raw.extra.memo).toBe("hi");
    expect(raw.extra.frozenAmount).toBe("1000");
    expect(raw.extra.stake).toEqual({ address: "v", amount: "2500" });

    const persisted = JSON.parse(JSON.stringify(raw));
    expect(persisted.extra.stake.amount).toBe("2500");

    const revived = fromOperationRaw(persisted, "accId", null, fromOperationExtraRaw);
    expect(revived.extra.ledgerOpType).toBe("FREEZE");
    expect(revived.extra.memo).toBe("hi");
    expect(revived.extra.frozenAmount).toEqual(new BigNumber(1000));
    expect(revived.extra.stake.amount).toEqual(new BigNumber(2500));
  });

  it("revives an unconverted stake.amount as a string, not a BigNumber, without the framework hook", () => {
    const op = baseOperation({ stake: { address: "v", amount: new BigNumber(2500) } });
    const raw = toOperationRaw(op, undefined, undefined);
    const persisted = JSON.parse(JSON.stringify(raw));

    expect(persisted.extra.stake.amount).toBe("2500");
    expect(JSON.stringify(new BigNumber(2500))).toBe('"2500"');

    const revived = fromOperationRaw(persisted, "accId", null, undefined);
    expect(typeof revived.extra.stake.amount).toBe("string");
    expect(BigNumber.isBigNumber(revived.extra.stake.amount)).toBe(false);
  });
});
