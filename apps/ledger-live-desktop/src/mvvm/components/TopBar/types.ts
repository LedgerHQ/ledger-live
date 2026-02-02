type TopBarAction = {
  label: string;
  tooltip: string;
  icon: React.ComponentType;
  isInteractive: boolean;
  onClick: () => void;
};

type TopBarViewProps = {
  actionsList: TopBarAction[];
};

export type { TopBarAction, TopBarViewProps };
