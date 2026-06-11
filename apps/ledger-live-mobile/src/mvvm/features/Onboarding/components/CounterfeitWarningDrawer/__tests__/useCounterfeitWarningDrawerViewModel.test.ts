import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/devices";
import { act, renderHook } from "@testing-library/react-native";
import i18next from "i18next";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import {
  useCounterfeitWarningDrawerViewModel,
  type CounterfeitWarningDrawerContainerProps,
} from "../useCounterfeitWarningDrawerViewModel";
import { COUNTERFEIT_WARNING_BUTTON, COUNTERFEIT_WARNING_PAGE } from "../analytics";

const trackMock = jest.mocked(track);

const defaultProps: CounterfeitWarningDrawerContainerProps = {
  isOpen: true,
  deviceModelId: DeviceModelId.nanoX,
  onProceed: jest.fn(),
  onDismiss: jest.fn(),
};

const analyticsPayload = (properties: Record<string, unknown>) => ({
  deviceModelId: DeviceModelId.nanoX,
  flow: "Onboarding",
  ...properties,
});

describe("useCounterfeitWarningDrawerViewModel", () => {
  let openURLSpy: jest.SpiedFunction<typeof Linking.openURL>;

  beforeEach(() => {
    jest.clearAllMocks();
    openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    openURLSpy.mockRestore();
  });

  it("should track page_viewed once per open transition", () => {
    const { rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) =>
        useCounterfeitWarningDrawerViewModel({ ...defaultProps, isOpen }),
      { initialProps: { isOpen: true } },
    );

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith(
      "page_viewed",
      analyticsPayload({ page: COUNTERFEIT_WARNING_PAGE }),
    );

    rerender({ isOpen: true });
    expect(trackMock).toHaveBeenCalledTimes(1);
  });

  it("should reset page_viewed tracking when the drawer closes and reopens", () => {
    const { rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) =>
        useCounterfeitWarningDrawerViewModel({ ...defaultProps, isOpen }),
      { initialProps: { isOpen: true } },
    );
    expect(trackMock).toHaveBeenCalledTimes(1);

    rerender({ isOpen: false });
    expect(trackMock).toHaveBeenCalledTimes(1);

    rerender({ isOpen: true });
    expect(trackMock).toHaveBeenCalledTimes(2);
  });

  it("should not track page_viewed when closed", () => {
    renderHook(() => useCounterfeitWarningDrawerViewModel({ ...defaultProps, isOpen: false }));

    expect(trackMock).not.toHaveBeenCalledWith("page_viewed", expect.anything());
  });

  it("should resolve i18n labels from translation keys", () => {
    const { result } = renderHook(() => useCounterfeitWarningDrawerViewModel(defaultProps));

    expect(result.current.title).toBe(i18next.t("onboarding.counterfeitWarning.title"));
    expect(result.current.primaryCtaLabel).toBe(
      i18next.t("onboarding.counterfeitWarning.cta.primary"),
    );
    expect(result.current.secondaryCtaLabel).toBe(
      i18next.t("onboarding.counterfeitWarning.cta.secondary"),
    );
  });

  it("should track continue setup and call onProceed", () => {
    const onProceed = jest.fn();
    const { result } = renderHook(() =>
      useCounterfeitWarningDrawerViewModel({ ...defaultProps, onProceed }),
    );

    act(() => {
      result.current.onProceed();
    });

    expect(trackMock).toHaveBeenCalledWith(
      "button_clicked",
      analyticsPayload({
        button: COUNTERFEIT_WARNING_BUTTON.continueSetup,
        page: COUNTERFEIT_WARNING_PAGE,
      }),
    );
    expect(onProceed).toHaveBeenCalledTimes(1);
  });

  it("should open the genuine check URL and track learn more on secondary CTA", () => {
    const { result } = renderHook(() => useCounterfeitWarningDrawerViewModel(defaultProps));

    act(() => {
      result.current.onConcern();
    });

    expect(trackMock).toHaveBeenCalledWith(
      "button_clicked",
      analyticsPayload({
        button: COUNTERFEIT_WARNING_BUTTON.learnMore,
        page: COUNTERFEIT_WARNING_PAGE,
      }),
    );
    expect(openURLSpy).toHaveBeenCalledWith(urls.genuineCheck.learnMore);
  });

  it("should open body links without analytics", () => {
    const { result } = renderHook(() => useCounterfeitWarningDrawerViewModel(defaultProps));

    act(() => {
      result.current.onLedgerComLink();
    });
    expect(openURLSpy).toHaveBeenCalledWith(urls.ledger);

    act(() => {
      result.current.onResellerLink();
    });
    expect(openURLSpy).toHaveBeenCalledWith(urls.ledgerReseller);
    expect(trackMock).not.toHaveBeenCalledWith("button_clicked", {
      button: COUNTERFEIT_WARNING_BUTTON.learnMore,
      page: COUNTERFEIT_WARNING_PAGE,
    });
  });

  it("should track close and call onDismiss", () => {
    const onDismiss = jest.fn();
    const { result } = renderHook(() =>
      useCounterfeitWarningDrawerViewModel({ ...defaultProps, onDismiss }),
    );

    act(() => {
      result.current.onDismiss();
    });

    expect(trackMock).toHaveBeenCalledWith(
      "button_clicked",
      analyticsPayload({
        button: COUNTERFEIT_WARNING_BUTTON.close,
        page: COUNTERFEIT_WARNING_PAGE,
      }),
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
