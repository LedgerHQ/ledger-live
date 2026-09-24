import { makeSync } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Account } from "@ledgerhq/types-live";
import { getCoinFrameworkAccountBridge } from "../accountBridge";
import { getBridgeApi } from "../bridge";
import type { CoinFrameworkSigner } from "../types";

jest.mock("@ledgerhq/ledger-wallet-framework/bridge/jsHelpers", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/bridge/jsHelpers"),
  makeSync: jest.fn(),
}));
jest.mock("../bridge", () => ({ getBridgeApi: jest.fn() }));

const assignFromAccountRawMock = jest.fn();
const assignToAccountRawMock = jest.fn();
const fromOperationExtraRawMock = jest.fn();
const toOperationExtraRawMock = jest.fn();

jest.mock("../accountRawAssign", () => ({
  getAccountRawAssignHooks: jest.fn(async () => ({
    assignFromAccountRaw: assignFromAccountRawMock,
    assignToAccountRaw: assignToAccountRawMock,
    fromOperationExtraRaw: fromOperationExtraRawMock,
    toOperationExtraRaw: toOperationExtraRawMock,
  })),
}));

const stubSigner: CoinFrameworkSigner = {
  getAddress: async () => ({ address: "addr", path: "path", publicKey: "pub" }),
  context: async (_deviceId, fn) => fn(undefined),
};

describe("getCoinFrameworkAccountBridge — raw-assign hook wiring", () => {
  // `account/serialization.ts` reads `from/toOperationExtraRaw` off the bridge, so a hook declared
  // but not returned silently leaves a family's revived operation extra un-deserialised.
  it("exposes every declared raw-assign hook on the resolved account bridge", async () => {
    const bridge = await getCoinFrameworkAccountBridge("networkx", "local", stubSigner);

    expect(bridge.assignFromAccountRaw).toBe(assignFromAccountRawMock);
    expect(bridge.assignToAccountRaw).toBe(assignToAccountRawMock);
    expect(bridge.fromOperationExtraRaw).toBe(fromOperationExtraRawMock);
    expect(bridge.toOperationExtraRaw).toBe(toOperationExtraRawMock);
  });
});

describe("getCoinFrameworkAccountBridge — shouldMergeOps", () => {
  const mergesOpsFor = async (bridgeApi: object) => {
    jest.mocked(getBridgeApi).mockResolvedValue(bridgeApi);
    await getCoinFrameworkAccountBridge("networkx", "local", stubSigner);
    const { shouldMergeOps } = jest.mocked(makeSync).mock.calls.at(-1)![0];

    if (typeof shouldMergeOps !== "function") throw new Error("shouldMergeOps is not a function");
    return shouldMergeOps({ currency: { id: "x" } } as Account);
  };

  it("merges stored operations for a family that sets nothing", async () => {
    await expect(mergesOpsFor({})).resolves.toBe(true);
  });

  it("leaves the operation list to the account shape for a family that opts out", async () => {
    await expect(mergesOpsFor({ shouldMergeOps: false })).resolves.toBe(false);
  });
});
