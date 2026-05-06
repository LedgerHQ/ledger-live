import {
  Bell,
  BellNotification,
  Clock,
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
  | typeof Clock
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
  /** Extra CSS class applied to the TooltipContent (e.g. `"max-w-sm"` for multi-line wrapping). */
  tooltipClassName?: string;
  /** Called when the tooltip is shown (e.g. on hover). Used for analytics when showing error tooltip. */
  onTooltipShow?: () => void;
  /** When set, renders a Button (icon + text label) instead of an IconButton. */
  cta?: string;
};

/** A slot is either a generic action (button), the notification indicator (button + drawer), or the history button. */
type TopBarSlot =
  | { type: "action"; action: TopBarAction }
  | { type: "notification" }
  | { type: "history" };

type TopBarViewProps = {
  slots: TopBarSlot[];
  shouldShowFirmwareUpdateBanner: boolean;
  isInformationCenterOpen: boolean;
  onInformationCenterClose: () => void;
  shouldDisplayAggregatedAssets: boolean;
};

export type { TopBarAction, TopBarActionAppearance, TopBarSlot, TopBarViewProps };
