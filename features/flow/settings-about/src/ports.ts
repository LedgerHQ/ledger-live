export type SettingsAboutLinks = Readonly<{
  terms: string;
  x: string;
  instagram: string;
  github: string;
}>;

/** What the About section needs from the app: its version, its links and the developer unlock. */
export type SettingsAboutPort = Readonly<{
  version: string;
  links: SettingsAboutLinks;
  unlockDeveloperTools(): void;
}>;
