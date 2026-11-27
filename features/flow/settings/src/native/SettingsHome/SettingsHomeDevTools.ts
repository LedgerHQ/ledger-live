/**
 * Developer tool screens the app opens from the home. Each row is omitted when its callback is
 * undefined, so the app decides when the Developer and Debug rows are visible.
 */
export type SettingsHomeDevTools = Readonly<{
  onOpenDeveloper?: () => void;
  onOpenDebug?: () => void;
}>;
