/** Developer tool screens the app opens from the home. No `onOpenDebug`: no Debug row. */
export type SettingsHomeDevTools = Readonly<{
  onOpenDeveloper: () => void;
  onOpenDebug?: () => void;
}>;
