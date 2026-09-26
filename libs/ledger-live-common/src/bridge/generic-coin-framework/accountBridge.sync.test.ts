import { firstValueFrom } from "rxjs";
import { makeSync } from "../jsHelpers";
import { getCoinFrameworkAccountBridge } from "./accountBridge";

jest.mock("../jsHelpers", () => ({
  ...jest.requireActual("../jsHelpers"),
  makeSync: jest.fn(actual => actual),
}));
const makeSyncMock = jest.mocked(makeSync);

jest.mock("./signer", () => ({ getSigner: jest.fn(async () => ({})) }));
jest.mock("./accountRawAssign", () => ({ getAccountRawAssignHooks: jest.fn(async () => ({})) }));

const op = (hash: string, blockHeight: number) =>
  ({ id: hash, hash, blockHeight, accountId: "accId", type: "IN" }) as any;

describe("the generic bridge's sync", () => {
  it("does not let the outer merge undo the store bound", async () => {
    // The shape returns a list that is already merged and already bounded. With the outer merge
    // left on, `mergeOps(stored, shape.operations)` re-adds what the bound dropped -- the bound
    // never reaches the store, and only a test through `makeSync` can see it.
    await getCoinFrameworkAccountBridge("mainnet", "local");

    const { getAccountShape, shouldMergeOps } = makeSyncMock.mock.calls[0][0] as any;
    expect(shouldMergeOps).toBe(false);

    const bounded = [op("h11", 11), op("h10", 10), op("h9", 9)];
    const sync = jest.requireActual("../jsHelpers").makeSync({
      getAccountShape: async () => ({ id: "accId", operations: bounded, operationsCount: 3 }),
      shouldMergeOps,
    });

    const stored = {
      id: "accId",
      currency: { id: "ethereum", units: [{ magnitude: 18 }] },
      operations: [op("h8", 8), op("h7", 7), op("h6", 6)],
      pendingOperations: [],
      subAccounts: [],
      derivationMode: "",
      freshAddress: "0xabc",
      seedIdentifier: "0xabc",
      index: 0,
    } as any;

    const updater = (await firstValueFrom(sync(stored, { paginationConfig: {} } as any))) as (
      account: any,
    ) => any;
    const synced = updater(stored);

    // Exactly what the shape returned: the three older operations the bound dropped stay dropped.
    expect(synced.operations.map((o: any) => o.hash)).toEqual(["h11", "h10", "h9"]);
    expect(getAccountShape).toBeDefined();
  });
});
