import { act, renderHook } from "@testing-library/react";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { setOperationSink } from "@shared/observability-operations";
import { toReceiveAddressOptions } from "../../logic/toReceiveAddressOptions";
import { useReceiveAddressOperation } from "./useReceiveAddressOperation";
import type { ReceiveScreenData } from "./useReceiveScreenData";

type Params = Parameters<typeof useReceiveAddressOperation>[0];

const ETH = CryptoOrTokenCurrencyIdSchema.parse("ethereum");
const ETHEREUM = { id: ETH, type: "CryptoCurrency" as const };
const [TRANSPARENT, SHIELDED] = toReceiveAddressOptions(
  mockAccountReceive({ shielded: { address: "zs1shielded" } }),
);

const LOADING: ReceiveScreenData = { type: "loading" };
const READY: ReceiveScreenData = { type: "ready", receive: mockAccountReceive() };
const ONBOARDING_REQUIRED: ReceiveScreenData = { type: "onboardingRequired" };
const ACTIVATION_REQUIRED: ReceiveScreenData = { type: "activationRequired" };
const readFailed = (retry = jest.fn()): ReceiveScreenData => ({
  type: "error",
  retry,
  failedKinds: ["receive", "assetStatus"],
  readError: { name: "NetworkDown", message: "sync failed" },
});
const ACCOUNT_MISSING: ReceiveScreenData = {
  type: "error",
  retry: jest.fn(),
  failedKinds: ["account"],
  readError: undefined,
};

const NOTHING_PICKED = { isSelecting: false, selected: undefined };
const CHOOSING = { isSelecting: true, selected: undefined };
const pickedOption = (option = TRANSPARENT) => ({ isSelecting: false, selected: option });

const START_ATTRIBUTES = {
  currency_id: "ethereum",
  asset_type: "coin",
  network_id: "ethereum",
  source: "Portfolio",
};

const sink = { isRecording: () => true, start: jest.fn(), succeed: jest.fn(), fail: jest.fn() };

function renderOperation(initial: Partial<Params> = {}, { reactStrictMode = false } = {}) {
  let params: Params = {
    assetId: ETH,
    source: "Portfolio",
    onClose: jest.fn(),
    onResolveGate: jest.fn(),
    asset: ETHEREUM,
    network: ETHEREUM,
    data: LOADING,
    selection: NOTHING_PICKED,
    sanctionStatus: "checking",
    ...initial,
  };
  const rendered = renderHook((props: Params) => useReceiveAddressOperation(props), {
    initialProps: params,
    reactStrictMode,
  });
  const update = (next: Partial<Params>) => {
    params = { ...params, ...next };
    rendered.rerender(params);
  };
  const showAddress = (option = TRANSPARENT) =>
    update({ data: READY, selection: pickedOption(option), sanctionStatus: "clear" });

  return { ...rendered, params: () => params, update, showAddress };
}

describe("useReceiveAddressOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setOperationSink(sink);
  });

  afterEach(() => {
    setOperationSink(null);
  });

  it("should start once when the screen mounts, with the asset, its network, the entry point and the first attempt", () => {
    const { update } = renderOperation();
    update({ data: READY, selection: CHOOSING });

    expect(sink.start).toHaveBeenCalledTimes(1);
    expect(sink.start).toHaveBeenCalledWith("receive_address", undefined, {
      ...START_ATTRIBUTES,
      attempt: 1,
    });
  });

  it("should send the asset type and network with the ending when they are known after the start", () => {
    const { update, showAddress } = renderOperation({ asset: undefined, network: undefined });

    update({ asset: ETHEREUM, network: ETHEREUM });
    showAddress();

    expect(sink.start).toHaveBeenCalledWith("receive_address", undefined, {
      currency_id: "ethereum",
      source: "Portfolio",
      attempt: 1,
    });
    expect(sink.succeed).toHaveBeenCalledWith(
      "receive_address",
      undefined,
      expect.objectContaining({ asset_type: "coin", network_id: "ethereum" }),
    );
  });

  it("should succeed once the first address is shown, with its option and no service incident", () => {
    const { showAddress } = renderOperation();

    showAddress();

    expect(sink.succeed).toHaveBeenCalledTimes(1);
    expect(sink.succeed).toHaveBeenCalledWith("receive_address", undefined, {
      ...START_ATTRIBUTES,
      attempt: 1,
      address_option: "transparent",
      service_incident: false,
    });
    expect(sink.fail).not.toHaveBeenCalled();
  });

  it("should tell a service incident was open when the address is shown", () => {
    const { showAddress } = renderOperation({ serviceIncidents: [{ title: "Ethereum degraded" }] });

    showAddress();

    expect(sink.succeed).toHaveBeenCalledWith(
      "receive_address",
      undefined,
      expect.objectContaining({ service_incident: true }),
    );
  });

  it("should succeed with the address chosen after the address options were shown", () => {
    const { update, showAddress } = renderOperation();
    update({ data: READY, selection: CHOOSING });

    showAddress(SHIELDED);

    expect(sink.succeed).toHaveBeenCalledWith(
      "receive_address",
      undefined,
      expect.objectContaining({
        step: "selecting",
        has_address_choice: true,
        address_option: "shielded",
      }),
    );
  });

  it("should succeed as sanctioned when the picked address is on the sanctions list", () => {
    const { update } = renderOperation();

    update({ data: READY, selection: pickedOption(), sanctionStatus: "sanctioned" });

    expect(sink.succeed).toHaveBeenCalledWith(
      "receive_address",
      undefined,
      expect.objectContaining({ outcome: "sanctioned" }),
    );
  });

  it("should tell the gate was resolved when the address is shown after it", () => {
    const { update, showAddress } = renderOperation();
    update({ data: ACTIVATION_REQUIRED });

    showAddress();

    expect(sink.succeed).toHaveBeenCalledWith(
      "receive_address",
      undefined,
      expect.objectContaining({ address_option: "transparent", gate_resolved: true }),
    );
  });

  it.each([
    { data: ONBOARDING_REQUIRED, outcome: "onboarding_required" },
    { data: ACTIVATION_REQUIRED, outcome: "activation_required" },
  ])(
    "should succeed as $outcome when the user closes the screen on the gate",
    ({ data, outcome }) => {
      const { result, params } = renderOperation({ data });

      act(() => result.current.onClose());

      expect(sink.succeed).toHaveBeenCalledWith("receive_address", undefined, {
        ...START_ATTRIBUTES,
        attempt: 1,
        outcome,
        gate_action_opened: false,
      });
      expect(sink.fail).not.toHaveBeenCalled();
      expect(params().onClose).toHaveBeenCalledTimes(1);
    },
  );

  it("should succeed on the gate without the gate action when the screen unmounts on it", () => {
    const { unmount } = renderOperation({ data: ONBOARDING_REQUIRED });

    unmount();

    expect(sink.succeed).toHaveBeenCalledWith(
      "receive_address",
      undefined,
      expect.objectContaining({ outcome: "onboarding_required", gate_action_opened: false }),
    );
    expect(sink.fail).not.toHaveBeenCalled();
  });

  it("should succeed with the gate action opened when the app closes the dialog to open the family flow", () => {
    const refreshGate = jest.fn();
    const appResolveGate = jest.fn(() => rendered.unmount());
    const rendered = renderOperation({ data: ACTIVATION_REQUIRED, onResolveGate: appResolveGate });

    act(() => rendered.result.current.onResolveGate?.(refreshGate));

    expect(appResolveGate).toHaveBeenCalledWith(refreshGate);
    expect(sink.succeed).toHaveBeenCalledWith(
      "receive_address",
      undefined,
      expect.objectContaining({ outcome: "activation_required", gate_action_opened: true }),
    );
    expect(sink.fail).not.toHaveBeenCalled();
  });

  it("should keep the gate action opened on the address shown once the user is back from the family flow", () => {
    const { result, showAddress } = renderOperation({ data: ONBOARDING_REQUIRED });
    act(() => result.current.onResolveGate?.(jest.fn()));

    showAddress();

    expect(sink.succeed).toHaveBeenCalledWith(
      "receive_address",
      undefined,
      expect.objectContaining({ gate_action_opened: true, gate_resolved: true }),
    );
  });

  it("should give no gate action when the app has none", () => {
    const { result } = renderOperation({ onResolveGate: undefined });

    expect(result.current.onResolveGate).toBeUndefined();
  });

  it("should keep the attempt going when the screen leaves a read error without a retry", () => {
    const { update, showAddress } = renderOperation({ data: readFailed() });

    update({ data: LOADING });
    showAddress();

    expect(sink.start).toHaveBeenCalledTimes(1);
    expect(sink.fail).not.toHaveBeenCalled();
    expect(sink.succeed).toHaveBeenCalledWith(
      "receive_address",
      undefined,
      expect.objectContaining({ attempt: 1, address_option: "transparent" }),
    );
  });

  it("should fail the attempt as an error, read again and start the next attempt when the user retries", () => {
    const retryRead = jest.fn();
    const { result, update, showAddress } = renderOperation({ data: readFailed(retryRead) });

    act(() => result.current.onRetry());
    update({ data: LOADING });
    showAddress();

    expect(retryRead).toHaveBeenCalledTimes(1);
    expect(sink.fail).toHaveBeenCalledWith(
      "receive_address",
      undefined,
      "ERROR",
      expect.objectContaining({
        attempt: 1,
        trigger: "retry",
        failed_kinds: "receive,assetStatus",
        error_name: "NetworkDown",
        error_message: "sync failed",
      }),
    );
    expect(sink.start).toHaveBeenLastCalledWith("receive_address", undefined, {
      ...START_ATTRIBUTES,
      attempt: 2,
    });
    expect(sink.succeed).toHaveBeenCalledWith(
      "receive_address",
      undefined,
      expect.objectContaining({ attempt: 2, address_option: "transparent" }),
    );
  });

  it.each(["close", "unmount"] as const)(
    "should fail as an error with the read failure when the screen is left on the error (%s)",
    trigger => {
      const { result, unmount } = renderOperation({ data: readFailed() });

      act(() => (trigger === "close" ? result.current.onClose() : unmount()));

      expect(sink.fail).toHaveBeenCalledWith(
        "receive_address",
        undefined,
        "ERROR",
        expect.objectContaining({
          trigger,
          failed_kinds: "receive,assetStatus",
          error_name: "NetworkDown",
        }),
      );
    },
  );

  it("should fail as an error naming the missing account when the user closes the screen", () => {
    const { result } = renderOperation({ data: ACCOUNT_MISSING });

    act(() => result.current.onClose());

    expect(sink.fail).toHaveBeenCalledWith("receive_address", undefined, "ERROR", {
      ...START_ATTRIBUTES,
      attempt: 1,
      trigger: "close",
      failed_kinds: "account",
      error_name: "AccountNotFound",
    });
  });

  it.each([
    { step: "loading", state: {} },
    { step: "selecting", state: { data: READY, selection: CHOOSING } },
    {
      step: "checking_sanction",
      state: { data: READY, selection: pickedOption(), sanctionStatus: "checking" as const },
    },
  ])(
    "should be abandoned with the $step step when the user closes the screen before an address is shown",
    ({ step, state }) => {
      const { result, update, params } = renderOperation();
      update(state);

      act(() => result.current.onClose());

      expect(sink.fail).toHaveBeenCalledWith(
        "receive_address",
        undefined,
        "ABANDONED",
        expect.objectContaining({ trigger: "close", step }),
      );
      expect(params().onClose).toHaveBeenCalledTimes(1);
    },
  );

  it("should be abandoned when the screen unmounts before an address is shown", () => {
    const { unmount } = renderOperation();

    unmount();

    expect(sink.fail).toHaveBeenCalledWith(
      "receive_address",
      undefined,
      "ABANDONED",
      expect.objectContaining({ trigger: "unmount", step: "loading" }),
    );
  });

  it("should start again after the simulated remount of strict mode, and end with a single success", () => {
    const { showAddress } = renderOperation({}, { reactStrictMode: true });

    showAddress();

    expect(sink.fail).toHaveBeenCalledWith(
      "receive_address",
      undefined,
      "ABANDONED",
      expect.objectContaining({ trigger: "unmount" }),
    );
    expect(sink.start).toHaveBeenCalledTimes(2);
    expect(sink.succeed).toHaveBeenCalledTimes(1);
    expect(sink.start).toHaveBeenLastCalledWith("receive_address", undefined, {
      ...START_ATTRIBUTES,
      attempt: 1,
    });
    expect(sink.start.mock.invocationCallOrder.at(-1)).toBeLessThan(
      sink.succeed.mock.invocationCallOrder[0],
    );
  });

  it("should send nothing more after a success, even on a later read error and retry", () => {
    const retryRead = jest.fn();
    const { result, update, showAddress, unmount } = renderOperation();
    showAddress(SHIELDED);

    update({ data: readFailed(retryRead), selection: NOTHING_PICKED });
    act(() => result.current.onRetry());
    update({ data: READY, selection: CHOOSING });
    showAddress(TRANSPARENT);
    act(() => result.current.onClose());
    unmount();

    expect(retryRead).toHaveBeenCalledTimes(1);
    expect(sink.start).toHaveBeenCalledTimes(1);
    expect(sink.succeed).toHaveBeenCalledTimes(1);
    expect(sink.fail).not.toHaveBeenCalled();
  });

  it("should send nothing more once the user closed the screen", () => {
    const { result, update, showAddress } = renderOperation({ data: readFailed() });
    act(() => result.current.onClose());

    update({ data: LOADING });
    showAddress();

    expect(sink.start).toHaveBeenCalledTimes(1);
    expect(sink.fail).toHaveBeenCalledTimes(1);
    expect(sink.succeed).not.toHaveBeenCalled();
  });
});
