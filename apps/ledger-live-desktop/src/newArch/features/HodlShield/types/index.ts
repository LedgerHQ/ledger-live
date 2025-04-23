export enum EntryPoint {
  onboarding = "onboarding",
  settings = "settings",
}

export type EntryPointsData = Record<
  keyof typeof EntryPoint,
  {
    enabled: boolean;
    onClick: () => void;
    component: ({ onPress }: { onPress: () => void }) => JSX.Element;
  }
>;
