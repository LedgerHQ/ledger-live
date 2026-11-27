/** What the About section needs from the app: its version, the localized terms URL and the developer unlock. */
export type SettingsAboutPort = Readonly<{
  version: string;
  termsUrl: string;
  unlockDeveloperTools(): void;
}>;
