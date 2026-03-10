import {
  Bell,
  BellNotification,
  Eye,
  EyeCross,
  Experiment,
  Settings,
  Tools,
} from "@ledgerhq/lumen-ui-react/symbols";
import { DeviceIconComponent } from "LLD/utils/getDeviceIcon";
import { ActivityIndicatorIcon } from "./utils/getActivityIndicatorIcon";

type IconComponent =
  | typeof Bell
  | typeof BellNotification
  | typeof Eye
  | typeof EyeCross
  | typeof Experiment
  | typeof Settings
  | typeof Tools
  | ActivityIndicatorIcon
  | DeviceIconComponent;

type TopBarActionAppearance = "gray" | "accent";

type TopBarAction = {
  label: string;
  tooltip?: string;
  isInteractive: boolean;
  onClick: () => void;
  icon: IconComponent;
  /** Visual appearance of the button. Defaults to "gray". */
  appearance?: TopBarActionAppearance;
  /** Called when the tooltip is shown (e.g. on hover). Used for analytics when showing error tooltip. */
  onTooltipShow?: () => void;
};

/** A slot is either a generic action (button) or the notification indicator (button + drawer). */
type TopBarSlot = { type: "action"; action: TopBarAction } | { type: "notification" };

type TopBarViewProps = {
  slots: TopBarSlot[];
  shouldShowFirmwareUpdateBanner: boolean;
};

export type { TopBarAction, TopBarActionAppearance, TopBarSlot, TopBarViewProps };
