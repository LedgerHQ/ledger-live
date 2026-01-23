export type QuickAction = {
  title: string;
  onAction: () => void;
  icon: React.ComponentType;
  disabled: boolean;
};
