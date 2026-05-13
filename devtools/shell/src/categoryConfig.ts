import {
  Settings,
  Experiment2,
  Bluetooth,
  DocumentCode,
  Bug,
  Information,
  SpeedFast,
  Planet,
} from "@ledgerhq/lumen-ui-react/symbols";
import { Category } from "./types";

// IconProps and IconSize are not exported from @ledgerhq/lumen-ui-react.
// Settings is already imported and shares the same props shape as all lumen symbols,
// so we derive the icon component type from it to stay in sync with the package.
export type IconComponent = typeof Settings;

export const CATEGORY_ICONS: Record<Category, IconComponent> = {
  [Category.CONFIGURATION]: Settings,
  [Category.FEATURES_AND_FLOWS]: Experiment2,
  [Category.CONNECTIVITY]: Bluetooth,
  [Category.GENERATORS]: DocumentCode,
  [Category.DEBUGGING]: Bug,
  [Category.INFORMATION]: Information,
  [Category.PERFORMANCE]: SpeedFast,
  [Category.PLAYGROUND]: Planet,
};
