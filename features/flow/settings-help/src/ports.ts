/** The app picks what `support` opens: the support page, the chatbot or the FAQ. */
export type HelpLinks = Readonly<{ support: string; academy: string; status: string }>;

/** `clearCache` resolves once the app has handled its own failures. */
type HelpCommonPort = Readonly<{
  links: HelpLinks;
  clearCache(): Promise<void>;
}>;

/** The desktop rows too. `resetApp` resolves like `clearCache`. */
export type DesktopHelpPort = HelpCommonPort &
  Readonly<{
    platform: "desktop";
    resetApp(): Promise<void>;
    viewUserData(): void;
    launchOnboarding(): void;
  }>;

/** `supportOpensChatbot` renames the support row after the chatbot it then opens. */
export type MobileHelpPort = HelpCommonPort &
  Readonly<{
    platform: "mobile";
    supportOpensChatbot: boolean;
    saveLogs(): void;
  }>;

/** Links and actions only the app can provide. */
export type HelpPort = DesktopHelpPort | MobileHelpPort;
