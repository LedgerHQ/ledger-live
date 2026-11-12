import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getMockServerConfig,
  getMockServerDeviceModelId,
  useMockServerDevices,
  type MockServerConfig,
} from "@features/platform-device-mock-server";
import {
  selectIsMockServerFloatingButtonHidden,
  selectMockServerDeviceScreenWidth,
  selectMockServerOverlayMode,
} from "../../state/selectors";
import { setMockServerDeviceScreenWidth, setMockServerOverlayMode } from "../../state/slice";
import type { MockServerOverlayMode } from "../../state/types";
import { useMockServerStatus, type MockServerStatus } from "../../useMockServerStatus";
import type { MockServerOverlayDevice, MockServerOverlayProps } from "./types";

export type MockServerOverlayViewModel = Omit<MockServerOverlayProps, "settings"> & {
  config: MockServerConfig | null;
  status: MockServerStatus;
  devices: readonly MockServerOverlayDevice[];
  selectedDevice: MockServerOverlayDevice | null;
  deviceScreenWidth: number;
  isPanelOpen: boolean;
  isPanelMounted: boolean;
  isFloatingButtonHidden: boolean;
  onPressMain: () => void;
  onPressDevice: (deviceId: string) => void;
  onResizeDeviceScreen: (width: number) => void;
};

const HIDDEN: MockServerOverlayMode = { type: "hidden" };
const MAIN: MockServerOverlayMode = { type: "main" };

export function useMockServerOverlayViewModel({
  settings: { enabled, url, token },
  ...props
}: MockServerOverlayProps): MockServerOverlayViewModel {
  const config = useMemo(() => getMockServerConfig({ enabled, url, token }), [enabled, url, token]);
  const dispatch = useDispatch();
  const storedMode = useSelector(selectMockServerOverlayMode);
  const isFloatingButtonHidden = useSelector(selectIsMockServerFloatingButtonHidden);
  const deviceScreenWidth = useSelector(selectMockServerDeviceScreenWidth);
  const { status } = useMockServerStatus(config);
  const serverDevices = useMockServerDevices(status === "connected" ? config : null);

  const devices = useMemo(
    () =>
      serverDevices
        .flatMap(device => {
          const modelId = getMockServerDeviceModelId(device);
          return modelId ? [{ id: device.id, name: device.name, modelId }] : [];
        })
        .map((device, index) => ({ ...device, number: index + 1 })),
    [serverDevices],
  );

  const selectedDevice =
    storedMode.type === "device"
      ? (devices.find(device => device.id === storedMode.deviceId) ?? null)
      : null;
  const isSelectedDeviceGone = storedMode.type === "device" && selectedDevice === null;
  const mode = isSelectedDeviceGone ? HIDDEN : storedMode;

  const isPanelOpen = mode.type === "main";
  const [hasOpenedPanel, setHasOpenedPanel] = useState(false);
  if (isPanelOpen && !hasOpenedPanel) setHasOpenedPanel(true);

  const onPressMain = useCallback(() => {
    dispatch(setMockServerOverlayMode(mode.type === "main" ? HIDDEN : MAIN));
  }, [dispatch, mode.type]);

  const onPressDevice = useCallback(
    (deviceId: string) => {
      const isShown = mode.type === "device" && mode.deviceId === deviceId;
      dispatch(setMockServerOverlayMode(isShown ? HIDDEN : { type: "device", deviceId }));
    },
    [dispatch, mode],
  );

  const onResizeDeviceScreen = useCallback(
    (width: number) => dispatch(setMockServerDeviceScreenWidth(width)),
    [dispatch],
  );

  return {
    ...props,
    config,
    status,
    devices,
    selectedDevice,
    deviceScreenWidth,
    isPanelOpen,
    isPanelMounted: hasOpenedPanel,
    isFloatingButtonHidden,
    onPressMain,
    onPressDevice,
    onResizeDeviceScreen,
  };
}
