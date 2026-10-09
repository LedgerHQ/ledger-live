import { act, renderHook, waitFor } from "@testing-library/react";
import type { PendingUnshield } from "@ledgerhq/coin-evm/confidential";
import { usePendingUnshield } from "../hooks/usePendingUnshield";
import { confidentialApi } from "../utils/confidentialApi";
import {
  clearSessionUnshield,
  getSessionUnshield,
  setSessionUnshield,
} from "../utils/sessionUnshields";
import { createDeviceTransactionExecutor, getReceipt } from "../utils/deviceTransactionExecutor";

jest.mock("../utils/confidentialRuntime", () => ({
  createConfidentialContext: jest.fn(() => ({ config: jest.fn(), logger: jest.fn() })),
  getSepoliaRpcUrl: jest.fn(() => "rpc"),
}));
jest.mock("../utils/deviceTransactionExecutor", () => ({
  getReceipt: jest.fn(),
  createDeviceTransactionExecutor: jest.fn(),
}));
jest.mock("../utils/confidentialApi", () => ({
  confidentialApi: {
    parseUnwrapRequested: jest.fn(),
    resumeUnshield: jest.fn(),
    prepareFinalizeUnshield: jest.fn(),
  },
}));

const ACCOUNT_ID = "token-1";
const WRAPPER = "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639";
const REQUEST_HASH = `0x${"aa".repeat(32)}`;
const PAIR = { underlying: "0xusdc", wrapper: WRAPPER, rate: 1n, wrapperDecimals: 6 };
const PENDING: PendingUnshield = {
  currencyId: "ethereum_sepolia",
  wrapper: WRAPPER,
  unwrapRequestId: `0x${"bb".repeat(32)}`,
  requester: "0x0a101aA5347Bb16F43019BE42ce5830395739e33",
  recipient: "0x0a101aA5347Bb16F43019BE42ce5830395739e33",
  amount: 1_000_000n,
  requestTxHash: REQUEST_HASH,
  requestBlock: 100,
};
const RECEIPT = {
  transactionHash: REQUEST_HASH,
  blockNumber: "0x64",
  from: PENDING.requester,
  status: "0x1",
  logs: [],
};

const api = jest.mocked(confidentialApi);
const signTransaction = jest.fn();
const onFinalized = jest.fn();

function render() {
  return renderHook(() =>
    usePendingUnshield({
      tokenAccountId: ACCOUNT_ID,
      currencyId: "ethereum_sepolia",
      pair: PAIR,
      createConfidentialClient: jest.fn(),
      signTransaction,
      onFinalized,
    }),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  clearSessionUnshield(ACCOUNT_ID);
  api.parseUnwrapRequested.mockReturnValue({ ...PENDING, amount: undefined });
});

describe("usePendingUnshield", () => {
  it("shows nothing without an unshield in this session", () => {
    expect(render().result.current).toBeNull();
  });

  it("waits for the request to be mined", async () => {
    jest.mocked(getReceipt).mockResolvedValue(null);
    setSessionUnshield(ACCOUNT_ID, { requestTxHash: REQUEST_HASH, amount: 1_000_000n });

    const { result } = render();

    await waitFor(() => expect(getReceipt).toHaveBeenCalledWith("rpc", REQUEST_HASH));
    expect(result.current?.status).toBe("awaiting-request");
    expect(api.resumeUnshield).not.toHaveBeenCalled();
  });

  it("reads the request from its receipt, keeps the wrapper amount, then follows it", async () => {
    jest.mocked(getReceipt).mockResolvedValue(RECEIPT);
    api.resumeUnshield.mockResolvedValue({ status: "awaiting-decryption" });
    setSessionUnshield(ACCOUNT_ID, { requestTxHash: REQUEST_HASH, amount: 1_000_000n });

    const { result } = render();

    await waitFor(() => expect(result.current?.status).toBe("awaiting-decryption"));
    expect(api.parseUnwrapRequested).toHaveBeenCalledWith(
      expect.anything(),
      "ethereum_sepolia",
      expect.objectContaining({ transactionHash: REQUEST_HASH, blockNumber: 100, status: "0x1" }),
      WRAPPER,
    );
    expect(getSessionUnshield(ACCOUNT_ID)?.pending).toEqual(PENDING);
  });

  it("finalizes on the device once ready, then refreshes the balance", async () => {
    api.resumeUnshield.mockResolvedValue({ status: "ready" });
    api.prepareFinalizeUnshield.mockResolvedValue({
      transaction: "0xfinalize",
      handle: PENDING.unwrapRequestId,
      cleartext: 1_000_000n,
      payout: 1_000_000n,
    });
    const executor = {
      signAndBroadcast: jest.fn().mockResolvedValue("0xhash"),
      waitForConfirmation: jest.fn().mockResolvedValue(undefined),
    };
    jest.mocked(createDeviceTransactionExecutor).mockReturnValue(executor);
    setSessionUnshield(ACCOUNT_ID, {
      requestTxHash: REQUEST_HASH,
      amount: 1_000_000n,
      pending: PENDING,
    });

    const { result } = render();
    await waitFor(() => expect(result.current?.status).toBe("ready"));
    await act(() => result.current!.onFinalize());

    expect(api.prepareFinalizeUnshield).toHaveBeenCalledWith(
      expect.anything(),
      "ethereum_sepolia",
      PENDING,
    );
    expect(createDeviceTransactionExecutor).toHaveBeenCalledWith(
      expect.objectContaining({ currencyId: "ethereum_sepolia", signTransaction }),
    );
    expect(executor.signAndBroadcast).toHaveBeenCalledWith({ transaction: "0xfinalize" });
    expect(executor.waitForConfirmation).toHaveBeenCalledWith("0xhash");
    expect(onFinalized).toHaveBeenCalledTimes(1);
    expect(getSessionUnshield(ACCOUNT_ID)).toBeUndefined();
  });

  it("forgets an unshield the chain already finalized", async () => {
    api.resumeUnshield.mockResolvedValue({ status: "finalized", payout: 1_000_000n });
    setSessionUnshield(ACCOUNT_ID, {
      requestTxHash: REQUEST_HASH,
      amount: 1_000_000n,
      pending: PENDING,
    });

    render();

    await waitFor(() => expect(onFinalized).toHaveBeenCalledTimes(1));
    expect(getSessionUnshield(ACCOUNT_ID)).toBeUndefined();
  });

  it("reports a reverted request", async () => {
    api.resumeUnshield.mockResolvedValue({ status: "invalid", reason: "reverted" });
    setSessionUnshield(ACCOUNT_ID, {
      requestTxHash: REQUEST_HASH,
      amount: 1_000_000n,
      pending: PENDING,
    });

    const { result } = render();

    await waitFor(() => expect(result.current?.status).toBe("failed"));
  });
});
