import { act, renderHook, waitFor } from "@testing-library/react";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";
import { track } from "@shared/analytics";
import {
  ACCOUNT,
  ACCOUNT_UUID,
  ADDRESS,
  SELECTION,
  TOKEN,
  fakeDevice,
  fakePorts,
} from "../__tests__/verifyAddressPorts";
import {
  useVerifyAddressExecutorViewModel,
  type UseVerifyAddressExecutorViewModelParams,
  type VerifyAddressExecutorViewModel,
} from "./useVerifyAddressExecutorViewModel";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const mockTrack = jest.mocked(track);

const TOKEN_SELECTION = {
  ...SELECTION,
  assetId: CryptoOrTokenCurrencyIdSchema.parse("ethereum/erc20/usd_tether__erc20_"),
};
const PUBLIC_KEY_SELECTION = {
  ...SELECTION,
  verification: mockAccountReceive({
    verification: { type: "publicKey", path: "m/44h/60h/0h/0/0", publicKey: "302a" },
  }).verification!,
};

const REFUSED_ON_DEVICE = Object.assign(new Error("refused"), { name: "UserRefusedAddress" });
const DEVICE_FAILURE = new Error("device unplugged");
const NEVER_CONFIRMED = new Promise<never>(() => {});

const flushPromises = () => new Promise(resolve => setTimeout(resolve));

type DeviceAnswer = "refused" | "failed" | "verified" | "pending";

function getAddressAnswering(...answers: readonly DeviceAnswer[]) {
  const getAddress = jest.fn(async (): Promise<{ address: string }> => NEVER_CONFIRMED);
  for (const answer of answers) {
    getAddress.mockImplementationOnce(async () => {
      if (answer === "refused") throw REFUSED_ON_DEVICE;
      if (answer === "failed") throw DEVICE_FAILURE;
      if (answer === "verified") return { address: ADDRESS };
      return NEVER_CONFIRMED;
    });
  }
  return getAddress;
}

function runIntentJobLikeTheExecutor<InitInput>(
  executor: () => VerifyAddressExecutorViewModel<InitInput>,
) {
  const states: VerifyAddressIntentJobState[] = [];
  const deviceConnectionResult = {
    ...fakeDevice().connection,
    connectedDevice: { modelId: DeviceModelId.STAX },
  } as unknown as DeviceConnectionResult;
  const run = () => {
    const { intent, onIntentJobError } = executor();
    intent
      .job({
        deviceConnectionResult,
        deviceExtractedContext: {} as never,
        input: intent.input,
        onResult: result => intent.onResult?.(result),
      })
      .subscribe({ next: state => states.push(state), error: () => onIntentJobError() });
  };
  const retryRefusal = () => {
    const lastState = states.at(-1);
    if (lastState?.type !== "cancelled") throw new Error("The job did not report a refusal");
    lastState.retry();
  };
  run();

  return { retryAfterError: run, retryRefusal };
}

function renderViewModel(
  params: Partial<UseVerifyAddressExecutorViewModelParams> = {},
  ports = fakePorts(),
) {
  const onExit = jest.fn();
  const { result, rerender } = renderHook(() =>
    useVerifyAddressExecutorViewModel({ selection: SELECTION, onExit, ...params }, { ...ports }),
  );

  return { onExit, ports, rerender, result };
}

async function renderReadyViewModel(
  params: Partial<UseVerifyAddressExecutorViewModelParams> = {},
  ports = fakePorts(),
) {
  const rendered = renderViewModel(params, ports);
  await waitFor(() => expect(rendered.result.current).not.toBeNull());

  return { ...rendered, executor: () => rendered.result.current! };
}

async function verifyWithDeviceAnswering(...answers: readonly DeviceAnswer[]) {
  const rendered = await renderReadyViewModel(
    {},
    fakePorts({ getAddress: getAddressAnswering(...answers) }),
  );
  const job = runIntentJobLikeTheExecutor(rendered.executor);
  await act(flushPromises);

  return { ...rendered, ...job };
}

describe("useVerifyAddressExecutorViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should open the account's app and show the app's intent screens, tracked with the asset and network", async () => {
    const { executor, ports } = await renderReadyViewModel();

    expect(ports.getAccount).toHaveBeenCalledWith(ACCOUNT_UUID);
    expect(executor().deviceInitializationInput).toEqual({ appName: "Ethereum" });
    expect(ports.buildInitializationInput).toHaveBeenCalledWith({
      account: ACCOUNT,
      tokenCurrency: undefined,
    });
    expect(executor().intent.input.expectedAddress).toBe(ADDRESS);
    expect(executor().intent.component).toBe(ports.intentComponent);
    expect(executor().analyticsProperties).toEqual({ asset: "ETH", network: "ethereum" });
  });

  it("should verify a token address in its parent app, tracked with the token ticker", async () => {
    const { executor, ports } = await renderReadyViewModel({ selection: TOKEN_SELECTION });

    expect(ports.findToken).toHaveBeenCalledWith(TOKEN_SELECTION.assetId);
    expect(ports.buildInitializationInput).toHaveBeenCalledWith({
      account: ACCOUNT,
      tokenCurrency: TOKEN,
    });
    expect(executor().analyticsProperties).toEqual({ asset: "USDT", network: "ethereum" });
  });

  it("should exit as failed, with no event, when the token is unknown", async () => {
    const { onExit, result } = renderViewModel(
      { selection: TOKEN_SELECTION },
      fakePorts({ findToken: jest.fn(async () => undefined) }),
    );

    await waitFor(() => expect(onExit).toHaveBeenCalledWith("failed"));
    expect(result.current).toBeNull();
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("should exit as failed when the device verification cannot be prepared", async () => {
    const { onExit } = renderViewModel(
      {},
      fakePorts({ buildInitializationInput: jest.fn(() => Promise.reject(new Error("network"))) }),
    );

    await waitFor(() => expect(onExit).toHaveBeenCalledWith("failed"));
  });

  it("should exit as failed when no legacy account backs the selected account", async () => {
    const { onExit } = renderViewModel({}, fakePorts({ getAccount: jest.fn(() => undefined) }));

    await waitFor(() => expect(onExit).toHaveBeenCalledWith("failed"));
  });

  it("should accept every device model by default", async () => {
    const { executor } = await renderReadyViewModel();

    expect(executor().deviceConnectionParams.acceptedDeviceModelIds).toEqual([]);
  });

  it("should refuse the device models the verification does not support", async () => {
    const { executor } = await renderReadyViewModel({
      unsupportedDeviceModelIds: [DeviceModelId.NANO_S],
    });

    const { acceptedDeviceModelIds } = executor().deviceConnectionParams;
    expect(acceptedDeviceModelIds).not.toContain(DeviceModelId.NANO_S);
    expect(acceptedDeviceModelIds).toContain(DeviceModelId.STAX);
  });

  it.each([
    { case: "the device cannot show the address", params: { selection: PUBLIC_KEY_SELECTION } },
    {
      case: "no device model supports the verification",
      params: { unsupportedDeviceModelIds: Object.values(DeviceModelId) },
    },
  ])("should exit as unsupported with its event when $case", async ({ params }) => {
    const { onExit, result } = renderViewModel(params);

    await waitFor(() => expect(onExit).toHaveBeenCalledWith("unsupported"));
    expect(result.current).toBeNull();
    expect(mockTrack).toHaveBeenCalledWith("receive_verification_unsupported", {
      page: "Receive Address Verification",
      flow: "receive",
      asset: "ETH",
      network: "ethereum",
    });
  });

  it("should prepare the verification once, even when the app gives new ports on each render", async () => {
    const { executor, ports, rerender } = await renderReadyViewModel();

    rerender();
    rerender();

    expect(ports.getAccount).toHaveBeenCalledTimes(1);
    expect(executor().deviceInitializationInput).toEqual({ appName: "Ethereum" });
  });

  describe("when the user retries on the device", () => {
    it("should exit as verified when the user confirms on a retry after a refusal", async () => {
      const { executor, onExit, retryRefusal } = await verifyWithDeviceAnswering(
        "refused",
        "verified",
      );
      act(retryRefusal);
      await act(flushPromises);

      act(() => executor().onUserCancel(null));

      expect(onExit).toHaveBeenCalledWith("verified");
    });

    it("should exit as dismissed when the user leaves a retry after a job error before confirming", async () => {
      const { executor, onExit, retryAfterError } = await verifyWithDeviceAnswering(
        "failed",
        "pending",
      );
      act(retryAfterError);
      await act(flushPromises);

      act(() => executor().onUserCancel(null));

      expect(onExit).toHaveBeenCalledWith("dismissed");
      expect(mockTrack).toHaveBeenCalledWith("receive_verification_dismiss", expect.anything());
    });

    it("should exit as failed when the retry after a refusal ends on a job error", async () => {
      const { executor, onExit, retryRefusal } = await verifyWithDeviceAnswering(
        "refused",
        "failed",
      );
      act(retryRefusal);
      await act(flushPromises);

      act(() => executor().onUserCancel(null));

      expect(onExit).toHaveBeenCalledWith("failed");
    });
  });
});
