import { Eye, EyeCross, Refresh, Warning } from "@ledgerhq/lumen-ui-react/symbols";
import { Spinner } from "@ledgerhq/lumen-ui-react";

type IconComponent =
  | typeof Eye
  | typeof EyeCross
  | typeof Refresh
  | typeof Spinner
  | typeof Warning;

type TopBarAction = {
  label: string;
  tooltip: string | null;
  isInteractive: boolean;
  onClick: () => void;
  icon: IconComponent;
};

type TopBarViewProps = {
  actionsList: TopBarAction[];
};

export type { TopBarAction, TopBarViewProps };
