import type { MockServerSettings } from "@features/platform-device-mock-server";

export type MockServerSessionDefaults = Readonly<{
  sessionImport: unknown;
  seed?: string;
}>;

export type MockServerHost = Readonly<{
  getSessionDefaults(): MockServerSessionDefaults;
  saveSettings(settings: MockServerSettings): void;
  forgetDevicesExcept(keptDeviceIds: ReadonlySet<string>): void;
  persistAndRestart(): Promise<void>;
}>;
