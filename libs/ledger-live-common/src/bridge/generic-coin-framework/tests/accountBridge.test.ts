import { getCoinFrameworkAccountBridge } from "../accountBridge";
import type { CoinFrameworkSigner } from "../types";

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

describe("getCoinFrameworkAccountBridge — raw-assign hook wiring", () => {
  const stubSigner: CoinFrameworkSigner = {
    getAddress: async () => ({ address: "addr", path: "path", publicKey: "pub" }),
    context: async (_deviceId, fn) => fn(undefined),
  };

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
