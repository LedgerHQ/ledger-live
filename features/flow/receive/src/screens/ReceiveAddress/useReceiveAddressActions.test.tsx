import { act, renderHook } from "@testing-library/react";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { track } from "@shared/analytics";
import {
  makeReceiveTestStore,
  receiveTestWrapper,
  testAccountUUID,
} from "../../__tests__/receiveTestStore";
import { toReceiveAddressOptions } from "../../logic/toReceiveAddressOptions";
import { useReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { DEFAULT_RECEIVE_FAMILY_CONFIG } from "../../logic/resolveReceiveFamilyConfig";
import { selectHasSeenReceiveVerifyHint } from "../../state";
import { useReceiveAddressActions } from "./useReceiveAddressActions";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const ETH = CryptoOrTokenCurrencyIdSchema.parse("ethereum");
const [shown] = toReceiveAddressOptions(mockAccountReceive());
const [unverifiable] = toReceiveAddressOptions(mockAccountReceive({ verification: undefined }));

function setup(overrides: Partial<Parameters<typeof useReceiveAddressActions>[0]> = {}) {
  const store = makeReceiveTestStore();
  const onCopyAddress = jest.fn(async () => true);
  const onShareAddress = jest.fn();
  const view = renderHook(
    () =>
      useReceiveAddressActions({
        accountUUID: testAccountUUID,
        assetId: ETH,
        selected: shown,
        familyConfig: {
          ...DEFAULT_RECEIVE_FAMILY_CONFIG,
          unsupportedDeviceModelIds: [DeviceModelId.NANO_S],
        },
        copy: useReceiveAddressCopy({ assetTicker: "ETH", networkName: "Ethereum" }),
        hasVerifyExecutor: true,
        onCopyAddress,
        onShareAddress,
        ...overrides,
      }),
    { wrapper: receiveTestWrapper(store) },
  );
  return { ...view, store, onCopyAddress, onShareAddress };
}

describe("useReceiveAddressActions", () => {
  beforeEach(() => jest.mocked(track).mockClear());

  it("should copy the address, then tell it was copied", async () => {
    const { result, onCopyAddress } = setup();

    await act(() => result.current.actions.copy!.onPress());

    expect(onCopyAddress).toHaveBeenCalledWith(shown.address);
    expect(result.current.actions.copy).toEqual(
      expect.objectContaining({ label: "Copied", hasCopied: true }),
    );
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "copy address", flow: "receive" }),
    );
  });

  it("should keep telling it was copied for 3 s after the last copy", async () => {
    jest.useFakeTimers();
    try {
      const { result } = setup();

      await act(() => result.current.actions.copy!.onPress());
      act(() => jest.advanceTimersByTime(2000));
      await act(() => result.current.actions.copy!.onPress());
      act(() => jest.advanceTimersByTime(2000));
      expect(result.current.actions.copy).toEqual(expect.objectContaining({ hasCopied: true }));

      act(() => jest.advanceTimersByTime(1000));
      expect(result.current.actions.copy).toEqual(
        expect.objectContaining({ label: "Copy", hasCopied: false }),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it("should share the address", () => {
    const { result, onShareAddress } = setup();

    act(() => result.current.actions.share!.onPress());

    expect(onShareAddress).toHaveBeenCalledWith(shown.address);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "share address" }),
    );
  });

  it("should offer no Share without a share sheet, no Verify without an executor", () => {
    const { result } = setup({ onShareAddress: undefined, hasVerifyExecutor: false });

    expect(result.current.actions.share).toBeUndefined();
    expect(result.current.actions.verify).toBeUndefined();
    expect(result.current.actions.verifyHint).toBeUndefined();
  });

  it("should start the device verification of the address shown, with the family's device models", () => {
    const { result, store } = setup();

    act(() => result.current.actions.verify!.onPress());

    expect(result.current.verification).toEqual(
      expect.objectContaining({
        selection: { accountUUID: testAccountUUID, assetId: ETH, verification: shown.verification },
        unsupportedDeviceModelIds: [DeviceModelId.NANO_S],
      }),
    );
    expect(selectHasSeenReceiveVerifyHint(store.getState())).toBe(true);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "verify address" }),
    );
  });

  it("should disable Verify, with no hint, when the device cannot show the address", () => {
    const { result } = setup({ selected: unverifiable });

    expect(result.current.actions.verify?.disabled).toBe(true);
    expect(result.current.actions.verifyHint).toBeUndefined();
    act(() => result.current.actions.verify!.onPress());
    expect(result.current.verification).toBeUndefined();
  });

  it("should disable Verify, with no hint, until the family config is known", () => {
    const { result } = setup({ familyConfig: undefined });

    expect(result.current.actions.copy).toBeDefined();
    expect(result.current.actions.verify?.disabled).toBe(true);
    expect(result.current.actions.verifyHint).toBeUndefined();
    act(() => result.current.actions.verify!.onPress());
    expect(result.current.verification).toBeUndefined();
  });

  it("should invite the user to verify until they dismiss the hint once", () => {
    const { result, store } = setup();

    expect(result.current.actions.verifyHint).toBeDefined();
    act(() => result.current.actions.verifyHint!.onGotIt());

    expect(result.current.actions.verifyHint).toBeUndefined();
    expect(selectHasSeenReceiveVerifyHint(store.getState())).toBe(true);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "dismiss verify popover" }),
    );
  });

  it("should do nothing before the address is shown", () => {
    const { result } = setup({ selected: undefined });

    expect(result.current.actions.disabled).toBe(true);
    expect(result.current.actions.verifyHint).toBeUndefined();
  });
});
