import { firstValueFrom } from "rxjs";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { getCoinFrameworkAccountBridge } from "../accountBridge";
import type { CoinFrameworkSigner } from "../types";

const getBridgeApiMock = jest.fn();
jest.mock("../bridge", () => ({
  getBridgeApi: (...a: unknown[]) => getBridgeApiMock(...a),
}));

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

describe("getCoinFrameworkAccountBridge — receive address lookup wiring", () => {
  const currency = getCryptoCurrencyById("hedera");
  const account = { currency, freshAddress: "0.0.1" } as Account;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the account address when the network bridge has an address lookup", async () => {
    getBridgeApiMock.mockResolvedValue({
      addressLookup: { getAddresses: jest.fn(), keyControlsAccount: () => true },
    });
    const bridge = await getCoinFrameworkAccountBridge("hedera", "local", stubSigner);

    const result = await firstValueFrom(
      bridge.receive(account, { verify: true, deviceId: "deviceId" }),
    );

    expect(result.address).toBe("0.0.1");
    expect(getBridgeApiMock).toHaveBeenCalledTimes(1);
    expect(getBridgeApiMock).toHaveBeenCalledWith(currency, "hedera");
  });

  it("returns the device address when the network bridge has no address lookup", async () => {
    getBridgeApiMock.mockResolvedValue({});
    const bridge = await getCoinFrameworkAccountBridge("hedera", "local", stubSigner);

    const result = await firstValueFrom(
      bridge.receive(account, { verify: false, deviceId: "deviceId" }),
    );

    expect(result.address).toBe("addr");
  });
});
