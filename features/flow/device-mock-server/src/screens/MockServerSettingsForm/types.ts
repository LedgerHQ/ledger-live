import type { MockServerSettings } from "@features/platform-device-mock-server";
import type { MockServerChange } from "../../mockServerSession";

export type MockServerSettingsFormProps = Readonly<{
  settings: MockServerSettings;
  defaultUrl: string;
  sessionImport: unknown;
  seed?: string;
  onApply: (change: MockServerChange) => Promise<void>;
}>;
