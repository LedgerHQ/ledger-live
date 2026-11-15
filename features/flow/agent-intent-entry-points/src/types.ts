export type AgentIntentSource = "nav_bar" | "profile";

export type AgentIntentEntryPoints = Readonly<{
  isNavBarEnabled: boolean;
  isProfileEnabled: boolean;
}>;
