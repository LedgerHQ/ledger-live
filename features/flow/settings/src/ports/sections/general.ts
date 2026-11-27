export type SettingsTheme = "system" | "light" | "dark";

/** Settings of the General section. */
export type GeneralSettingsValues = Readonly<{
  theme: SettingsTheme;
}>;
