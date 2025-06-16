export enum EntryPoint {
  manager = "manager",
  accounts = "accounts",
  settings = "settings",
}

export type EntryPointsData = Record<
  keyof typeof EntryPoint,
  {
    enabled: boolean;
    onClick: ({ page }: { page: string }) => void;
    component: ({ onPress }: { onPress: () => void }) => JSX.Element;
  }
>;
