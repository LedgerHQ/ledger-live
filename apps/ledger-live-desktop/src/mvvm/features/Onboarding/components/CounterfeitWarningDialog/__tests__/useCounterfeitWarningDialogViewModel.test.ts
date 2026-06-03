import { DeviceModelId } from "@ledgerhq/devices";
import { act, renderHook } from "tests/testSetup";
import { urls } from "~/config/urls";
import i18n from "~/renderer/i18n/init";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import useCounterfeitWarningDialogViewModel from "../useCounterfeitWarningDialogViewModel";
import {
  EVENT_DISMISSED,
  EVENT_LEARN_MORE,
  EVENT_PROCEED,
  EVENT_SHOWN,
} from "../analytics";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const defaultProps = {
  open: true,
  deviceModelId: DeviceModelId.nanoX,
  onProceed: jest.fn(),
  onDismiss: jest.fn(),
};

const renderViewModel = (props: typeof defaultProps = defaultProps) =>
  renderHook(() => useCounterfeitWarningDialogViewModel(props));

describe("useCounterfeitWarningDialogViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should track shown once per open transition", () => {
    const { rerender } = renderHook(({ open }) =>
      useCounterfeitWarningDialogViewModel({ ...defaultProps, open }),
    {
      initialProps: { open: false },
    });

    expect(track).not.toHaveBeenCalledWith(EVENT_SHOWN, expect.anything());

    rerender({ open: true });
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(EVENT_SHOWN, {
      deviceModelId: DeviceModelId.nanoX,
    });

    rerender({ open: false });
    rerender({ open: true });
    expect(track).toHaveBeenCalledTimes(2);
  });

  it("should track proceed and call onProceed", () => {
    const onProceed = jest.fn();
    const { result } = renderViewModel({ ...defaultProps, onProceed });

    act(() => {
      result.current.onProceed();
    });

    expect(track).toHaveBeenCalledWith(EVENT_PROCEED, { deviceModelId: DeviceModelId.nanoX });
    expect(onProceed).toHaveBeenCalledTimes(1);
  });

  it("should open learn more URL and track learn more on secondary CTA", () => {
    const { result } = renderViewModel();

    act(() => {
      result.current.onLearnMore();
    });
    expect(track).toHaveBeenCalledWith(EVENT_LEARN_MORE, { deviceModelId: DeviceModelId.nanoX });
    expect(openURL).toHaveBeenCalledWith(urls.genuineCheck);
  });

  it("should open body links without analytics", () => {
    const { result } = renderViewModel();

    act(() => {
      result.current.onLedgerComLink();
    });
    expect(openURL).toHaveBeenCalledWith(urls.ledger);

    act(() => {
      result.current.onResellerLink();
    });
    expect(openURL).toHaveBeenCalledWith(urls.ledgerReseller);
    expect(track).not.toHaveBeenCalledWith(EVENT_LEARN_MORE, expect.anything());
  });

  it("should track dismiss and call onDismiss", () => {
    const onDismiss = jest.fn();
    const { result } = renderViewModel({ ...defaultProps, onDismiss });

    act(() => {
      result.current.onDismiss();
    });
    expect(track).toHaveBeenCalledWith(EVENT_DISMISSED, { deviceModelId: DeviceModelId.nanoX });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should resolve copy from the counterfeit warning i18n keys", () => {
    const { result } = renderViewModel();

    expect(result.current.title).toBe(i18n.t("onboarding.counterfeitWarning.title"));
    expect(result.current.primaryCtaLabel).toBe(
      i18n.t("onboarding.counterfeitWarning.cta.primary"),
    );
    expect(result.current.secondaryCtaLabel).toBe(
      i18n.t("onboarding.counterfeitWarning.cta.secondary"),
    );
  });
});
