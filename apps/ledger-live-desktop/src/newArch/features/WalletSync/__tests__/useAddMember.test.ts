/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { TrustchainResultType } from "@ledgerhq/ledger-key-ring-protocol/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useAddMember } from "../hooks/useAddMember";
import {
  TrustchainAlreadyInitialized,
  TrustchainAlreadyInitializedWithOtherSeed,
} from "@ledgerhq/ledger-key-ring-protocol/errors";

const device = { deviceId: "", modelId: DeviceModelId.stax, wired: true };
const trustchain = {
  rootId: "trustchainId",
  walletSyncEncryptionKey: "0x123",
  applicationPath: "m/0'/16'/1'",
};

const Mocks = {
  sdk: { getOrCreateTrustchain: jest.fn() },
  memberCredentialsSelector: jest.fn(),
  setTrustchain: jest.fn(),
  setFlow: jest.fn(),
  track: jest.fn(),
};

describe("useAddMember", () => {
  it("should create a new trustchain", async () => {
    Mocks.sdk.getOrCreateTrustchain.mockResolvedValue({
      trustchain,
      type: TrustchainResultType.created,
    });
    const { result } = renderHook(() => useAddMember({ device }));

    await waitFor(() => expect(Mocks.sdk.getOrCreateTrustchain).toHaveBeenCalled());

    expect(result.current.error).toBeNull();
    expect(Mocks.setTrustchain).toHaveBeenCalledWith(trustchain);
    expect(Mocks.setFlow).toHaveBeenCalledWith({
      flow: Flow.Activation,
      step: Step.ActivationLoading,
      nextStep: Step.ActivationFinal,
      hasTrustchainBeenCreated: true,
    });
    expect(Mocks.track).toHaveBeenCalledTimes(1);
    expect(Mocks.track).toHaveBeenCalledWith("ledgersync_activated");
  });

  it("should get an existing trustchain", async () => {
    Mocks.sdk.getOrCreateTrustchain.mockResolvedValue({
      trustchain,
      type: TrustchainResultType.restored,
    });
    const { result } = renderHook(() => useAddMember({ device }));

    await waitFor(() => expect(Mocks.sdk.getOrCreateTrustchain).toHaveBeenCalled());

    expect(result.current.error).toBeNull();
    expect(Mocks.setTrustchain).toHaveBeenCalledWith(trustchain);
    expect(Mocks.setFlow).toHaveBeenCalledWith({
      flow: Flow.Activation,
      step: Step.ActivationLoading,
      nextStep: Step.SynchronizationFinal,
      hasTrustchainBeenCreated: false,
    });
    expect(Mocks.track).toHaveBeenCalledTimes(1);
    expect(Mocks.track).toHaveBeenCalledWith("ledgersync_activated");
  });

  it("should handle missing device", async () => {
    const { result } = renderHook(() => useAddMember({ device: null }));

    expect(result.current.error).toBeNull();
    expect(Mocks.setTrustchain).not.toHaveBeenCalledWith(trustchain);
    expect(Mocks.setFlow).toHaveBeenCalledWith({
      flow: Flow.Activation,
      step: Step.DeviceAction,
    });
    expect(Mocks.track).not.toHaveBeenCalled();
  });

  it("should handle already initialized trustchain", async () => {
    Mocks.sdk.getOrCreateTrustchain.mockRejectedValue(new TrustchainAlreadyInitialized());
    const { result } = renderHook(() => useAddMember({ device }));

    await waitFor(() => expect(Mocks.sdk.getOrCreateTrustchain).toHaveBeenCalled());

    expect(result.current.error).toBeNull();
    expect(Mocks.setTrustchain).not.toHaveBeenCalledWith(trustchain);
    expect(Mocks.setFlow).toHaveBeenCalledWith({
      flow: Flow.Synchronize,
      step: Step.AlreadySecuredSameSeed,
    });
    expect(Mocks.track).not.toHaveBeenCalled();
  });

  it("should handle trustchain initialized with other seed", async () => {
    Mocks.sdk.getOrCreateTrustchain.mockRejectedValue(
      new TrustchainAlreadyInitializedWithOtherSeed(),
    );
    const { result } = renderHook(() => useAddMember({ device }));

    await waitFor(() => expect(Mocks.sdk.getOrCreateTrustchain).toHaveBeenCalled());

    expect(result.current.error).toBeNull();
    expect(Mocks.setTrustchain).not.toHaveBeenCalledWith(trustchain);
    expect(Mocks.setFlow).toHaveBeenCalledWith({
      flow: Flow.Synchronize,
      step: Step.AlreadySecuredOtherSeed,
    });
    expect(Mocks.track).not.toHaveBeenCalled();
  });

  it("should handle missing member credentials", async () => {
    Mocks.memberCredentialsSelector.mockReturnValue(null);
    const { result } = renderHook(() => useAddMember({ device }));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(Mocks.sdk.getOrCreateTrustchain).not.toHaveBeenCalled();
    expect(Mocks.setTrustchain).not.toHaveBeenCalledWith(trustchain);
    expect(Mocks.setFlow).not.toHaveBeenCalled();
    expect(Mocks.track).not.toHaveBeenCalled();
  });

  it("should handle other sdk errors", async () => {
    Mocks.sdk.getOrCreateTrustchain.mockRejectedValue(new Error("Random error"));
    const { result } = renderHook(() => useAddMember({ device }));

    await waitFor(() => expect(Mocks.sdk.getOrCreateTrustchain).toHaveBeenCalled());

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe("Random error");
    expect(Mocks.setTrustchain).not.toHaveBeenCalled();
    expect(Mocks.setFlow).not.toHaveBeenCalled();
    expect(Mocks.track).not.toHaveBeenCalled();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Mocks.memberCredentialsSelector.mockReturnValue({
      pubkey: "pubkey",
      privatekey: "privatekey",
    });
  });
});

jest.mock("react-redux", () => {
  const dispatch = jest.fn();
  return {
    useDispatch: () => dispatch,
    useSelector: (selector: () => unknown) => selector(),
  };
});

jest.mock("@ledgerhq/ledger-key-ring-protocol/store", () => ({
  memberCredentialsSelector: () => Mocks.memberCredentialsSelector(),
  trustchainSelector: () => null,
  setTrustchain: (trustchain: unknown) => Mocks.setTrustchain(trustchain),
}));

jest.mock("~/renderer/actions/walletSync", () => ({
  setFlow: (flow: unknown) => Mocks.setFlow(flow),
}));

jest.mock("~/renderer/analytics/segment", () => ({
  track: (event: string) => Mocks.track(event),
}));

jest.mock("../hooks/useTrustchainSdk", () => ({
  useTrustchainSdk: () => Mocks.sdk,
}));
