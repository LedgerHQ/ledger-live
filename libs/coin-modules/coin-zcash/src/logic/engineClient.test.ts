import { assertCanSend, getZCashClient, getZCashModule } from "./engineClient";
import { getZainoEndpoint, setZainoGrpcUrl } from "../constants";
import type { ZCashClient } from "../network/types";

const createZCashClient = jest.fn();

jest.mock(
  "@ledgerhq/coin-zcash/network/ZCash",
  () => ({ createZCashClient: (...args: unknown[]) => createZCashClient(...args) }),
  { virtual: true },
);

const fullClient = () =>
  ({
    buildTransaction: jest.fn(),
    buildIronwoodTransaction: jest.fn(),
    finalizeTransaction: jest.fn(),
    broadcastTransaction: jest.fn(),
  }) as unknown as ZCashClient;

beforeEach(() => {
  createZCashClient.mockReset().mockImplementation(() => fullClient());
});

afterEach(() => setZainoGrpcUrl(null));

describe("getZCashClient", () => {
  it("hands back the client the engine built for the endpoint it was given", async () => {
    const engineClient = fullClient();
    createZCashClient.mockReturnValue(engineClient);

    expect(await getZCashClient({ grpcUrl: "https://zaino.example:443" })).toBe(engineClient);
    expect(createZCashClient).toHaveBeenCalledWith({ grpcUrl: "https://zaino.example:443" });
  });

  // The native module is loaded lazily and cached: the renderer resolves this
  // same import to the IPC client, and React Native to the stub.
  it("loads the engine module once and reuses it", async () => {
    const first = await getZCashModule();

    expect(await getZCashModule()).toBe(first);
  });
});

describe("assertCanSend", () => {
  it("accepts an engine that can build, finalize and broadcast", async () => {
    await expect(assertCanSend()).resolves.toBe(undefined);
    expect(createZCashClient).toHaveBeenCalledWith(getZainoEndpoint());
  });

  // A client that can build but not finalize would let the user sign and only
  // then fail, which is why all four are checked up front.
  it.each([
    "buildTransaction",
    "buildIronwoodTransaction",
    "finalizeTransaction",
    "broadcastTransaction",
  ])("refuses an engine missing %s", async missing => {
    createZCashClient.mockImplementation(() => {
      const client = fullClient() as unknown as Record<string, unknown>;
      delete client[missing];
      return client;
    });

    await expect(assertCanSend()).rejects.toThrow(
      "Shielded Zcash transactions are not supported in this environment",
    );
  });

  it("asks the endpoint the sync path uses, override included", async () => {
    setZainoGrpcUrl("https://testnet.zec.rocks");

    await assertCanSend();

    expect(createZCashClient).toHaveBeenCalledWith({
      grpcUrl: "https://testnet.zec.rocks",
      network: "testnet",
    });
  });
});
