import {
  Bell,
  BellNotification,
  Eye,
  EyeCross,
  Refresh,
  Warning,
} from "@ledgerhq/lumen-ui-react/symbols";
import { Spinner } from "@ledgerhq/lumen-ui-react";

type IconComponent =
  | typeof Bell
  | typeof BellNotification
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

/** A slot is either a generic action (button) or the notification indicator (button + drawer). */
type TopBarSlot = { type: "action"; action: TopBarAction } | { type: "notification" };

type TopBarViewProps = {
  slots: TopBarSlot[];
};

export type { TopBarAction, TopBarSlot, TopBarViewProps };
