import React from "react";
import { act, render, screen, waitFor } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceInfo } from "@ledgerhq/types-live";
import { useGetDeviceInfo } from "@ledgerhq/live-common/deviceSDK/hooks/useGetDeviceInfo";
import type { GetDeviceInfoActionState } from "@ledgerhq/live-common/deviceSDK/actions/getDeviceInfo";
import LocaleProvider from "~/context/Locale";
import type { State } from "~/reducers/types";
import { LANGUAGE_CHECK_TIMEOUT_MS, LanguagePrompt } from "../LanguagePrompt";

jest.mock("@ledgerhq/live-common/deviceSDK/hooks/useGetDeviceInfo", () => ({
  useGetDeviceInfo: jest.fn(),
}));

const mockUseGetDeviceInfo = jest.mocked(useGetDeviceInfo);

const device: Device = {
  deviceId: "stax-id",
  deviceName: "Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

const DEVICE_VERSION_ID = 17;
const FIRMWARE_ID = 42;

function deviceInfo(languageId: number): DeviceInfo {
  return {
    mcuVersion: "",
    version: "1.11.0",
    majMin: "1.11",
    targetId: 0x33200004,
    isBootloader: false,
    isOSU: false,
    providerName: null,
    managerAllowed: false,
    pinValidated: true,
    onboarded: false,
    languageId,
    seFlags: Buffer.alloc(4),
  };
}

function deviceInfoState(
  overrides: Partial<GetDeviceInfoActionState> = {},
): GetDeviceInfoActionState {
  return {
    deviceInfo: null,
    error: null,
    lockedDevice: false,
    ...overrides,
  } as GetDeviceInfoActionState;
}

function useManagerApi() {
  server.use(
    http.get("*/get_device_version", () => HttpResponse.json({ id: DEVICE_VERSION_ID })),
    http.get("*/get_firmware_version", () => HttpResponse.json({ id: FIRMWARE_ID })),
    http.get("*/language-package", () =>
      HttpResponse.json([
        {
          language: "french",
          language_package_version: [
            {
              language_package_id: 1,
              version: "1.0.0",
              language_package_version_id: 1,
              apdu_install_url: "",
              apdu_uninstall_url: "",
              bytes: 1,
              date_creation: "",
              date_last_modified: "",
              device_versions: [DEVICE_VERSION_ID],
              se_firmware_final_versions: [FIRMWARE_ID],
            },
          ],
        },
      ]),
    ),
  );
}

const inFrench = (state: State): State => ({
  ...state,
  settings: { ...state.settings, language: "fr" },
});

function renderPrompt(onDone: jest.Mock) {
  return render(
    <LocaleProvider>
      <LanguagePrompt device={device} onDone={onDone} />
    </LocaleProvider>,
    { overrideInitialState: inFrench },
  );
}

describe("LanguagePrompt", () => {
  beforeEach(() => {
    useManagerApi();
  });

  it("should be done without a drawer when the device already has the app language", async () => {
    mockUseGetDeviceInfo.mockReturnValue(deviceInfoState({ deviceInfo: deviceInfo(0x01) }));
    const onDone = jest.fn();

    renderPrompt(onDone);

    expect(onDone).not.toHaveBeenCalled();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(screen.queryByTestId("modal-close-button")).toBeNull();
  });

  it("should not be done while it offers the app language", async () => {
    mockUseGetDeviceInfo.mockReturnValue(deviceInfoState({ deviceInfo: deviceInfo(0x00) }));
    const onDone = jest.fn();

    renderPrompt(onDone);

    expect(await screen.findByTestId("modal-close-button")).toBeVisible();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("should be done once the user closes the drawer", async () => {
    mockUseGetDeviceInfo.mockReturnValue(deviceInfoState({ deviceInfo: deviceInfo(0x00) }));
    const onDone = jest.fn();

    const { user } = renderPrompt(onDone);
    await user.press(await screen.findByTestId("modal-close-button"));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it("should be done when the device info read fails", async () => {
    mockUseGetDeviceInfo.mockReturnValue(
      deviceInfoState({ error: { type: "SharedError", message: "failed" } } as never),
    );
    const onDone = jest.fn();

    renderPrompt(onDone);

    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it("should be done when the check takes too long", () => {
    mockUseGetDeviceInfo.mockReturnValue(deviceInfoState());
    const onDone = jest.fn();

    renderPrompt(onDone);
    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(LANGUAGE_CHECK_TIMEOUT_MS);
    });

    expect(onDone).toHaveBeenCalled();
  });
});
