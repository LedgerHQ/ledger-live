import type { SettingsPort } from "@features/flow-settings";

/** What the About section reads from the app: its version and the localized terms URL. */
export type SettingsAboutValues = Readonly<{
  version: string;
  termsUrl: string;
}>;

/** The part of the settings port the app provides to the About section: its values and the developer unlock. */
export type SettingsAboutPort = SettingsPort<SettingsAboutValues, never> &
  Readonly<{ unlockDeveloperTools(): void }>;
