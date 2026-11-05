import type { MockServerSettings } from "@features/platform-device-mock-server";
import type { MockServerSessionChange } from "../../mockServerSession";

export type MockServerSettingsFormProps = Readonly<{
  settings: MockServerSettings;
  defaultUrl: string;
  sessionImport: unknown;
  seed?: string;
  onApply: (change: MockServerSessionChange) => Promise<void>;
}>;
