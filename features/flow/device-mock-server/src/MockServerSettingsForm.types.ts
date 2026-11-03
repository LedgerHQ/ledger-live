import type { MockServerSettings } from "@features/platform-device-mock-server";
import type { MockServerHost } from "./model/ports";

export type MockServerSettingsFormProps = Readonly<{
  settings: MockServerSettings;
  defaultUrl: string;
  host: MockServerHost;
}>;
