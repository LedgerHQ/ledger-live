import type { MockServerSettings } from "@features/platform-device-mock-server";
import type { MockServerSessionChange } from "../../mockServerSession";

export type MockServerActivation = Readonly<{
  url: string;
  token?: string;
}>;

export type MockServerSettingsFormProps = Readonly<{
  settings: MockServerSettings;
  defaultUrl: string;
  sessionImport: unknown;
  seed?: string;
  onApply: (change: MockServerSessionChange) => Promise<void>;
  /** Asks to turn the mock server on, as a deeplink does: the form shows its warning first. */
  activationRequest?: MockServerActivation;
  onActivationRequestHandled?: () => void;
}>;
