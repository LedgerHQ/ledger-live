import { useCallback, useState } from "react";
import { useDeviceScreen } from "@ledgerhq/live-dmk-desktop";
import useEnv from "@features/platform-env";
import { DEVICE_SCREEN_MODELS } from "./utils/deviceModel";
import type { DeviceScreenViewModel } from "./types";

/**
 * localStorage key backing the panel's collapsed state, so a developer who
 * folds the screen away keeps it folded across renderer reloads.
 */
export const DEVICE_SCREEN_COLLAPSED_STORAGE_KEY = "MOCK_SERVER_DEVICE_SCREEN_COLLAPSED";

export function useDeviceScreenViewModel(): DeviceScreenViewModel {
  const mockServerTransportEnabled = useEnv("MOCK_SERVER_TRANSPORT");

  const [collapsed, setCollapsed] = useState(
    () => window.localStorage.getItem(DEVICE_SCREEN_COLLAPSED_STORAGE_KEY) === "1",
  );

  const handleToggleCollapsed = useCallback(() => {
    setCollapsed(previous => {
      const next = !previous;
      window.localStorage.setItem(DEVICE_SCREEN_COLLAPSED_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  // Polling stops while collapsed, but the hook stays mounted so the header
  // keeps rendering and expanding resumes without remounting the panel.
  const { device, state } = useDeviceScreen(mockServerTransportEnabled && !collapsed);

  return {
    isVisible: mockServerTransportEnabled && !!device,
    collapsed,
    handleToggleCollapsed,
    model: device ? DEVICE_SCREEN_MODELS[device.modelId] : null,
    state,
  };
}
