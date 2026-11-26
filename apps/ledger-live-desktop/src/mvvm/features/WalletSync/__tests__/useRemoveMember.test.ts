import { renderHook, waitFor } from "tests/testSetup";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useRemoveMember } from "../hooks/useRemoveMember";
import { KeyRingMemberIdSchema, type KeyRingMember } from "@features/platform-key-ring";
import { keyRingTreeUpdateFixture } from "@features/platform-key-ring/testing";
import { mockKeyRingTreeRecord } from "@domain/entity-key-ring/schema.mock";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";

const mockDevice = { deviceId: "device-1", modelId: DeviceModelId.stax, wired: true };
const mockMember: KeyRingMember = {
  id: KeyRingMemberIdSchema.parse("member-1"),
  name: "iPhone",
};
const ROTATED_TREE_RECORD = mockKeyRingTreeRecord({ applicationPath: "m/0'/16'/1'" });

function keyRingError(name: string): Error {
  return Object.assign(new Error(name), { name });
}

const Mocks = {
  removeMember: jest.fn(),
  setFlow: jest.fn(),
};

const mockDispatch = jest.fn((action: { type?: string; payload?: unknown }) => {
  if (action.type === "WALLET_SYNC_CHANGE_FLOW") Mocks.setFlow(action.payload);
});

jest.mock("LLD/hooks/redux", () => {
  const actual = jest.requireActual("LLD/hooks/redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

jest.mock("../hooks/useKeyRingClient", () => ({
  useKeyRingClient: () => ({ removeMember: Mocks.removeMember }),
}));

const initialState = {
  trustchain: mockKeyRingState(),
  settings: INITIAL_STATE_SETTINGS,
};

describe("useRemoveMember", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call onRetry when device is null", async () => {
    const { result } = renderHook(() => useRemoveMember({ device: null, member: mockMember }), {
      initialState,
    });

    await waitFor(() => {
      expect(Mocks.setFlow).toHaveBeenCalledWith({
        flow: Flow.ManageInstances,
        step: Step.DeviceActionInstance,
      });
    });
    // removeMember also runs and throws "Device not found", so error is set
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.error?.message).toBe("Device not found");
  });

  it("should call onResetFlow when member is null", async () => {
    const { result } = renderHook(() => useRemoveMember({ device: mockDevice, member: null }), {
      initialState,
    });

    await waitFor(() => {
      expect(Mocks.setFlow).toHaveBeenCalledWith({
        flow: Flow.ManageInstances,
        step: Step.SynchronizedInstances,
      });
    });
    expect(result.current.error).toBeNull();
  });

  it("should set an error without calling the key ring when this instance is not a member", async () => {
    const { result } = renderHook(
      () => useRemoveMember({ device: mockDevice, member: mockMember }),
      { initialState: { ...initialState, trustchain: mockKeyRingState({ trustchain: null }) } },
    );

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.error?.message).toBe("trustchain or memberCredentials is not set");
    expect(Mocks.removeMember).not.toHaveBeenCalled();
  });

  it("should remove member and transition to success step on success", async () => {
    Mocks.removeMember.mockResolvedValue(keyRingTreeUpdateFixture(ROTATED_TREE_RECORD));

    const { result, store } = renderHook(
      () => useRemoveMember({ device: mockDevice, member: mockMember }),
      { initialState },
    );

    await waitFor(() => {
      expect(Mocks.removeMember).toHaveBeenCalledWith(expect.anything(), {
        legacyDeviceId: mockDevice.deviceId,
        member: mockMember,
        callbacks: expect.objectContaining({
          onStartRequestUserInteraction: expect.any(Function),
          onEndRequestUserInteraction: expect.any(Function),
        }),
      });
    });

    await waitFor(() => {
      expect(store.getState().trustchain.trustchain).toEqual(ROTATED_TREE_RECORD);
      expect(Mocks.setFlow).toHaveBeenCalledWith({
        flow: Flow.ManageInstances,
        step: Step.InstanceSuccesfullyDeleted,
      });
    });
    expect(result.current.error).toBeNull();
  });

  it("should set error and dispatch UnsecuredLedger on TrustchainNotAllowed", async () => {
    const notAllowed = keyRingError("TrustchainNotAllowed");
    Mocks.removeMember.mockRejectedValue(notAllowed);

    const { result } = renderHook(
      () => useRemoveMember({ device: mockDevice, member: mockMember }),
      { initialState },
    );

    await waitFor(() => expect(Mocks.removeMember).toHaveBeenCalled());
    await waitFor(() => {
      expect(Mocks.setFlow).toHaveBeenCalledWith({
        flow: Flow.ManageInstances,
        step: Step.UnsecuredLedger,
      });
    });
    await waitFor(() => expect(result.current.error).toBe(notAllowed));
  });

  it("should set error on generic error", async () => {
    Mocks.removeMember.mockRejectedValue(new Error("Device not found"));

    const { result } = renderHook(
      () => useRemoveMember({ device: mockDevice, member: mockMember }),
      { initialState },
    );

    await waitFor(() => expect(Mocks.removeMember).toHaveBeenCalled());
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.error?.message).toBe("Device not found");
  });
});
