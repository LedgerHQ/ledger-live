import network from "@ledgerhq/live-network";
import { sha256 } from "../../crypto";
import { postSwapAccepted, postSwapCancelled } from "./postSwapState";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));

jest.mock("./utils/isIntegrationTestEnv", () => ({
  isIntegrationTestEnv: () => false,
}));

jest.mock("../../crypto", () => ({
  sha256: jest.fn(),
}));

const mockedNetwork = jest.mocked(network);
const mockedSha256 = jest.mocked(sha256);

describe("postSwapState wallet40 header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSha256.mockReturnValue(Buffer.from("fakehash"));
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

  it("does not add x-ledger-client-v4-ux when wallet40Ux flag is false", async () => {
    await postSwapAccepted({
      provider: "changelly",
      swapId: "swap-id",
      transactionId: "tx-id",
      flags: { wallet40Ux: false },
    });

    const request = mockedNetwork.mock.calls[0][0] as { headers?: Record<string, string> };
    expect(request.headers?.["x-ledger-client-v4-ux"]).toBeUndefined();
  });
});

describe("postSwapState resilience when sha256 crashes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSha256.mockImplementation(() => {
      throw new Error("crypto not available");
    });
  });

  it("postSwapAccepted still calls the BE with undefined hashes", async () => {
    const result = await postSwapAccepted({
      provider: "changelly",
      swapId: "swap-id",
      transactionId: "tx-id",
    });

    expect(mockedNetwork).toHaveBeenCalledTimes(1);
    const request = mockedNetwork.mock.calls[0][0] as {
      url: string;
      data: Record<string, unknown>;
    };
    expect(request.url).toContain("/swap/accepted");
    expect(request.data.swapIntentWithProvider).toBeUndefined();
    expect(request.data.swapIntentWithoutProvider).toBeUndefined();
    expect(request.data.provider).toBe("changelly");
    expect(request.data.swapId).toBe("swap-id");
    expect(result).toBeNull();
  });

  it("postSwapCancelled still calls the BE with undefined hashes", async () => {
    const result = await postSwapCancelled({
      provider: "changelly",
      swapId: "swap-id",
    });

    expect(mockedNetwork).toHaveBeenCalledTimes(1);
    const request = mockedNetwork.mock.calls[0][0] as {
      url: string;
      data: Record<string, unknown>;
    };
    expect(request.url).toContain("/swap/cancelled");
    expect(request.data.swapIntentWithProvider).toBeUndefined();
    expect(request.data.swapIntentWithoutProvider).toBeUndefined();
    expect(request.data.provider).toBe("changelly");
    expect(request.data.swapId).toBe("swap-id");
    expect(result).toBeNull();
  });
});

describe("postSwapState sends computed hashes when sha256 works", () => {
  const fakeHash = Buffer.from("a]1b2c3d4", "utf-8");
  const expectedHex = fakeHash.toString("hex");

  beforeEach(() => {
    jest.clearAllMocks();
    mockedSha256.mockReturnValue(fakeHash);
  });

  it("postSwapAccepted sends hex hashes in the payload", async () => {
    await postSwapAccepted({
      provider: "changelly",
      swapId: "swap-id",
      transactionId: "tx-id",
    });

    expect(mockedNetwork).toHaveBeenCalledTimes(1);
    const request = mockedNetwork.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(request.data.swapIntentWithProvider).toBe(expectedHex);
    expect(request.data.swapIntentWithoutProvider).toBe(expectedHex);
  });

  it("postSwapCancelled sends hex hashes in the payload", async () => {
    await postSwapCancelled({
      provider: "changelly",
      swapId: "swap-id",
    });

    expect(mockedNetwork).toHaveBeenCalledTimes(1);
    const request = mockedNetwork.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(request.data.swapIntentWithProvider).toBe(expectedHex);
    expect(request.data.swapIntentWithoutProvider).toBe(expectedHex);
  });
});
