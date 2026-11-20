import { track } from "@shared/analytics";
import type { Account } from "@ledgerhq/types-live";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import {
  XRP_ACCOUNT_WITH_TOKEN,
  XRP_IOU_REMOVAL,
  XRP_IOU_TOKEN_ACCOUNT,
  overrideWithAccounts,
} from "../../../__mocks__/account.mock";
import { makeMockAccountBridge } from "../../../__mocks__/bridge.mock";
import { useSignAndBroadcast } from "../useSignAndBroadcast";

const mockBroadcast = jest.fn();

jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => {
  return { useBroadcast: () => mockBroadcast };
});

jest.mock("LLM/components/DeviceIntentExecutor", () => {
  return { buildDeviceInitializationInput: jest.fn(async () => ({ appName: "XRP" })) };
});

jest.mock("~/datadog", () => {
  return { broadcastLogger: jest.fn() };
});

const transaction = makeMockAccountBridge().createTransaction(XRP_ACCOUNT_WITH_TOKEN);

const SIGNED_OPERATION = { operation: XRP_IOU_REMOVAL, signature: "sig" };

const onExit = jest.fn();
const onCancel = jest.fn();
const patchAccount = jest.fn((account: Account) => account);

function renderSignAndBroadcast() {
  return renderHook(
    () => {
      return useSignAndBroadcast({
        transaction,
        patchAccount,
        onCancel,
        onExit,
        action: "edit",
        account: XRP_ACCOUNT_WITH_TOKEN,
        tokenAccount: XRP_IOU_TOKEN_ACCOUNT,
        initialStep: "confirm",
      });
    },
    { overrideInitialState: overrideWithAccounts(XRP_ACCOUNT_WITH_TOKEN) },
  );
}

async function startSigning(result: ReturnType<typeof renderSignAndBroadcast>["result"]) {
  act(() => result.current.onSign());
  await waitFor(() => expect(result.current.signing).toBeDefined());
}

function signAndComplete(result: ReturnType<typeof renderSignAndBroadcast>["result"]) {
  act(() => {
    result.current.signing?.intent.onResult?.(SIGNED_OPERATION);
    result.current.onIntentJobComplete();
  });
}

describe("useSignAndBroadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBroadcast.mockResolvedValue(XRP_IOU_REMOVAL);
  });

  it("starts on the step it is given, as an info step", () => {
    const { result } = renderSignAndBroadcast();

    expect(result.current.infoStep).toBe("confirm");
    expect(result.current.isInfoSheetOpen).toBe(true);
    expect(result.current.signing).toBeUndefined();
  });

  it("builds one intent when it is asked to sign twice", async () => {
    const { result } = renderSignAndBroadcast();

    await startSigning(result);
    act(() => result.current.onSign());

    expect(result.current.isSigning).toBe(true);
    expect(result.current.isInfoSheetOpen).toBe(false);
    expect(buildDeviceInitializationInput).toHaveBeenCalledTimes(1);
  });

  it("broadcasts the signed operation, applies the update and shows success", async () => {
    const { result } = renderSignAndBroadcast();
    await startSigning(result);

    signAndComplete(result);

    expect(result.current.isBroadcasting).toBe(true);
    expect(result.current.signing).toBeUndefined();
    await waitFor(() => expect(result.current.infoStep).toBe("success"));
    expect(mockBroadcast).toHaveBeenCalledTimes(1);
    expect(mockBroadcast).toHaveBeenCalledWith(SIGNED_OPERATION);
    expect(patchAccount).toHaveBeenCalledTimes(1);
    expect(patchAccount).toHaveBeenCalledWith(expect.anything(), transaction);
  });

  it("shows the broadcast failure as signed", async () => {
    mockBroadcast.mockRejectedValue(new Error("Network down"));
    const { result } = renderSignAndBroadcast();
    await startSigning(result);

    signAndComplete(result);

    await waitFor(() => expect(result.current.infoStep).toBe("error"));
    expect(result.current.isSigned).toBe(true);
    expect(result.current.signError).toBeInstanceOf(Error);
    expect(patchAccount).not.toHaveBeenCalled();
  });

  it("forgets the signed intent after a failed broadcast, so Try again does not reuse it", async () => {
    mockBroadcast.mockRejectedValue(new Error("Network down"));
    const { result } = renderSignAndBroadcast();
    await startSigning(result);
    signAndComplete(result);
    await waitFor(() => expect(result.current.infoStep).toBe("error"));

    act(() => result.current.onSign());

    expect(result.current.isSigning).toBe(true);
    expect(result.current.signing).toBeUndefined();
    await waitFor(() => expect(result.current.signing).toBeDefined());
  });

  it("shows a failure to prepare the device as not signed", async () => {
    jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(new Error("No device"));
    const { result } = renderSignAndBroadcast();

    act(() => result.current.onSign());

    await waitFor(() => expect(result.current.infoStep).toBe("error"));
    expect(result.current.isSigned).toBe(false);
    expect(result.current.signing).toBeUndefined();
  });

  it("goes back to idle and tells the owner when the device step is cancelled", async () => {
    const { result } = renderSignAndBroadcast();
    await startSigning(result);

    act(() => result.current.onUserCancel());

    expect(result.current.isSigning).toBe(false);
    expect(result.current.isInfoSheetOpen).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("ignores a cancel once the operation is signed", async () => {
    const { result } = renderSignAndBroadcast();
    await startSigning(result);
    signAndComplete(result);

    act(() => result.current.onUserCancel());

    expect(onCancel).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.infoStep).toBe("success"));
  });

  it("hands the broadcast operation to the owner once the closed sheet is hidden", async () => {
    const { result } = renderSignAndBroadcast();
    await startSigning(result);
    signAndComplete(result);
    await waitFor(() => expect(result.current.infoStep).toBe("success"));

    act(() => result.current.onInfoSheetClose());
    expect(onExit).not.toHaveBeenCalled();
    act(() => result.current.onInfoSheetHidden());

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith(XRP_IOU_REMOVAL);
  });

  it("hands the broadcast operation to the owner only once", async () => {
    const { result } = renderSignAndBroadcast();
    await startSigning(result);
    signAndComplete(result);
    await waitFor(() => expect(result.current.infoStep).toBe("success"));
    act(() => result.current.onClose());
    act(() => result.current.onInfoSheetHidden());

    act(() => result.current.onInfoSheetHidden());

    expect(onExit).toHaveBeenCalledTimes(2);
    expect(onExit).toHaveBeenLastCalledWith(undefined);
  });

  it("tells the owner of a close without an operation", () => {
    const { result } = renderSignAndBroadcast();

    act(() => result.current.onClose());
    act(() => result.current.onInfoSheetHidden());

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith(undefined);
  });

  it("tracks a signing error with the action and the token type", () => {
    const { result } = renderSignAndBroadcast();

    act(() => {
      result.current.onIntentJobStateChanged({
        type: "error",
        error: new Error("Device busy"),
        retry: jest.fn(),
      });
    });

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "error_displayed",
      expect.objectContaining({
        action: "edit",
        tokenType: "iou",
        step: "signature",
        message_id: "Error",
      }),
    );
  });

  it("does not track a job state that is not an error", () => {
    const { result } = renderSignAndBroadcast();

    act(() => result.current.onIntentJobStateChanged({ type: "cancelled", retry: jest.fn() }));

    expect(track).not.toHaveBeenCalled();
  });
});
