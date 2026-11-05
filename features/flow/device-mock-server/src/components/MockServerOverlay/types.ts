import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { MockServerDevice, MockServerSettings } from "@features/platform-device-mock-server";
import type { MockServerSessionChange } from "../../mockServerSession";

export type MockServerOverlayProps = Readonly<{
  settings: MockServerSettings;
  sessionImport: unknown;
  seed?: string;
  colorScheme: "light" | "dark";
  /** The floating bar sits at this z-index and the panel just under it. */
  zIndex: number;
  onApply: (change: MockServerSessionChange) => Promise<void>;
  onOpenSettings: () => void;
  onSaveKnownDevices: (devices: readonly MockServerDevice[]) => void;
}>;

export type MockServerOverlayDevice = Readonly<{
  id: string;
  name: string;
  modelId: DeviceModelId;
  number: number;
}>;
