import network from "@ledgerhq/live-network";
import { postSwapAccepted, postSwapCancelled } from "./postSwapState";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));

jest.mock("./utils/isIntegrationTestEnv", () => ({
  isIntegrationTestEnv: () => false,
}));

const mockedNetwork = jest.mocked(network);

describe("postSwapState wallet40 header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds x-ledger-client-v4-ux=true when wallet40Ux flag is true", async () => {
    await postSwapAccepted({
      provider: "changelly",
      swapId: "swap-id",
      transactionId: "tx-id",
      flags: { wallet40Ux: true },
    });

    const request = mockedNetwork.mock.calls[0][0] as { headers?: Record<string, string> };
    expect(request.headers?.["x-ledger-client-v4-ux"]).toBe("true");
  });

  it("adds x-ledger-client-v4-ux=true for cancelled call when wallet40Ux flag is true", async () => {
    await postSwapCancelled({
      provider: "changelly",
      swapId: "swap-id",
      swapAppVersion: "4.0.0",
      flags: { wallet40Ux: true },
    });

    const request = mockedNetwork.mock.calls[0][0] as { headers?: Record<string, string> };
    expect(request.headers?.["x-ledger-client-v4-ux"]).toBe("true");
    expect(request.headers?.["x-swap-app-version"]).toBe("4.0.0");
  });

  it("does not add x-ledger-client-v4-ux when wallet40Ux flag is missing", async () => {
    await postSwapAccepted({
      provider: "changelly",
      swapId: "swap-id",
      transactionId: "tx-id",
    });

    const request = mockedNetwork.mock.calls[0][0] as { headers?: Record<string, string> };
    expect(request.headers?.["x-ledger-client-v4-ux"]).toBeUndefined();
  });
});
