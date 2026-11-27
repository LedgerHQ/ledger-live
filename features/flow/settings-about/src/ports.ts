import type { SettingsAboutRowId } from "./SettingsAbout.types";

/**
 * What the About section needs from the app: its version, the localized terms URL and the
 * developer unlock. Mobile also provides the feedback action, the store review page and the row
 * tracking; desktop leaves them out, so it has no feedback or rate row.
 */
export type SettingsAboutPort = Readonly<{
  version: string;
  termsUrl: string;
  unlockDeveloperTools(): void;
  /** Opens the in-app feedback flow. The feedback row is shown only when this is set. */
  feedback?(): void;
  /**
   * Store page where the user can rate the app, and the store's name for the row title (e.g.
   * "App Store"). The rate row is shown only when this is set.
   */
  storeReview?: Readonly<{ url: string; storeName: string }>;
  /** Called with the id of each row the user selects, so the app can track it. */
  onRowSelect?(rowId: SettingsAboutRowId): void;
}>;
