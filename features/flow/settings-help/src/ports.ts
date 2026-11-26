/** The app picks what `support` opens: the support page, the chatbot or the FAQ. */
export type HelpLinks = Readonly<{ support: string; academy: string; status: string }>;

/**
 * Links and actions only the app can provide. `clearCache` and `resetApp` resolve once the app
 * has handled its own failures.
 */
export type HelpPort = Readonly<{
  links: HelpLinks;
  clearCache(): Promise<void>;
  resetApp(): Promise<void>;
  viewUserData(): void;
  launchOnboarding(): void;
}>;
