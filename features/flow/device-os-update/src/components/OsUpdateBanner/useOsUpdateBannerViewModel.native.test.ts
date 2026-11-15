// oxlint-disable typescript/consistent-type-assertions
import { track } from "@shared/analytics";
import type { OsUpdate } from "@domain/entity-device-os-update";
import { act, renderHook } from "../../__tests__/render";
import { useOsUpdateBannerViewModel, type OsUpdateBannerProps } from "./useOsUpdateBannerViewModel";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(() => Promise.resolve()),
}));

const osUpdate = {
  finalFirmware: { version: "1.8.0" },
  osuFirmware: { notes: "notes" },
} as OsUpdate;

function DeviceIcon() {
  return null;
}

function setup(props: Partial<OsUpdateBannerProps> = {}, osUpdates: OsUpdate[] = [osUpdate]) {
  const onUpdate = jest.fn();
  const hook = renderHook(
    () =>
      useOsUpdateBannerViewModel({
        placement: "portfolio",
        hasCompletedOnboarding: true,
        hasConnectedDevice: true,
        analyticsModelId: "stax",
        DeviceIcon,
        onUpdate,
        ...props,
      }),
    { deviceOsUpdate: { osUpdates } },
  );
  return { ...hook, onUpdate };
}

describe("useOsUpdateBannerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the portfolio banner with the version of the last resolved update", () => {
    const { result } = setup({}, [{ finalFirmware: { version: "1.7.0" } } as OsUpdate, osUpdate]);

    expect(result.current.variant).toBe("portfolio");
    expect(result.current.version).toBe("1.8.0");
    expect(result.current.DeviceIcon).toBe(DeviceIcon);
  });

  it("shows the My Ledger banner there", () => {
    const { result } = setup({ placement: "myLedger" });

    expect(result.current.variant).toBe("myLedger");
  });

  it.each([
    ["there is no update", {}, []],
    ["onboarding is not completed", { hasCompletedOnboarding: false }, [osUpdate]],
    ["no device was connected in this session", { hasConnectedDevice: false }, [osUpdate]],
  ])("hides the banner when %s", (_label, props, osUpdates) => {
    const { result } = setup(props, osUpdates);

    expect(result.current.variant).toBe("hidden");
  });

  it("tracks its impression once, on the page it is shown on", () => {
    const { rerender } = setup({ placement: "myLedger" });
    rerender({});

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("banner_impression", {
      banner: "OS update",
      page: "my ledger",
      modelId: "stax",
    });
  });

  it("tracks the click, then lets the app open the update", () => {
    const { result, onUpdate } = setup();

    act(() => result.current.onClickUpdate());

    expect(track).toHaveBeenCalledWith("button_clicked", {
      page: "portfolio",
      banner: "OS update",
      button: "click(update)",
      modelId: "stax",
    });
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});
