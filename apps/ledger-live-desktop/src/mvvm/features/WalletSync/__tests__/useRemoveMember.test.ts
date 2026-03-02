import { renderHook, waitFor } from "tests/testSetup";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useRemoveMember } from "../hooks/useRemoveMember";
import { TrustchainMember, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { TrustchainNotAllowed } from "@ledgerhq/ledger-key-ring-protocol/errors";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";

const mockDevice = { deviceId: "device-1", modelId: DeviceModelId.stax, wired: true };
const mockMember: TrustchainMember = { id: "member-1", name: "iPhone", permissions: 112 };
const mockTrustchain: Trustchain = {
  rootId: "root",
  walletSyncEncryptionKey: "0xkey",
  applicationPath: "m/0'/16'/1'",
};

const Mocks = {
  removeMember: jest.fn(),
  setFlow: jest.fn(),
  setTrustchain: jest.fn(),
};

const mockDispatch = jest.fn((action: { type?: string; payload?: unknown }) => {
  if (action.type === "WALLET_SYNC_CHANGE_FLOW") Mocks.setFlow(action.payload);
  else Mocks.setTrustchain(action.payload ?? action);
});

jest.mock("LLD/hooks/redux", () => {
  const actual = jest.requireActual("LLD/hooks/redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: (s: unknown) => unknown) => {
      if (selector.name === "trustchainSelector" || String(selector).includes("trustchain"))
        return mockTrustchain;
      if (selector.name === "memberCredentialsSelector" || String(selector).includes("member"))
        return { pubkey: "pk", privatekey: "sk" };
      return actual.useSelector(selector);
    },
  };
});

jest.mock("@ledgerhq/ledger-key-ring-protocol/store", () => ({
  ...jest.requireActual("@ledgerhq/ledger-key-ring-protocol/store"),
  setTrustchain: (t: Trustchain) => ({ type: "SET_TRUSTCHAIN", payload: t }),
}));

jest.mock("../hooks/useTrustchainSdk", () => ({
  useTrustchainSdk: () => ({ removeMember: Mocks.removeMember }),
}));

const initialState = {
  trustchain: {
    trustchain: mockTrustchain,
    memberCredentials: { pubkey: "pk", privatekey: "sk" },
  },
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

  it("should remove member and transition to success step on success", async () => {
    Mocks.removeMember.mockResolvedValue(mockTrustchain);

    const { result } = renderHook(
      () => useRemoveMember({ device: mockDevice, member: mockMember }),
      { initialState },
    );

    await waitFor(() => {
      expect(Mocks.removeMember).toHaveBeenCalledWith(
        mockDevice.deviceId,
        mockTrustchain,
        expect.any(Object),
        mockMember,
        expect.objectContaining({
          onStartRequestUserInteraction: expect.any(Function),
          onEndRequestUserInteraction: expect.any(Function),
        }),
      );
    });

    await waitFor(() => {
      expect(Mocks.setTrustchain).toHaveBeenCalledWith(mockTrustchain);
      expect(Mocks.setFlow).toHaveBeenCalledWith({
        flow: Flow.ManageInstances,
        step: Step.InstanceSuccesfullyDeleted,
      });
    });
    expect(result.current.error).toBeNull();
  });

  it("should set error and dispatch UnsecuredLedger on TrustchainNotAllowed", async () => {
    Mocks.removeMember.mockRejectedValue(new TrustchainNotAllowed());

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
    expect(result.current.error).toBeInstanceOf(TrustchainNotAllowed);
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
