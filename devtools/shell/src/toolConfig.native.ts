import {
  Asterisk,
  Chart2,
  ChartPie,
  CloudSync,
  CreditCard,
  Folder,
  HandKey,
  IdCard,
  Label,
  Nano,
  Robot,
  SettingsAlt,
  Switch,
  TransferHorizontal,
  Wallet,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { CATEGORY_ICONS, type IconComponent } from "./categoryConfig";
import type { Category, ToolId, ValueOf } from "@devtools/registry";

const TOOL_ICONS: Readonly<Record<ToolId, IconComponent>> = {
  "feature-flags": Switch,
  env: Asterisk,
  "app-config": SettingsAlt,
  trustchain: HandKey,
  "cloud-sync": CloudSync,
  "device-onboarding": Nano,
  "mock-accounts": Robot,
  "account-data": Folder,
  "account-descriptor": IdCard,
  "account-name": Label,
  "account-portfolio": ChartPie,
  "account-balance": Wallet,
  "account-balance-history": Chart2,
  "account-operation": TransferHorizontal,
  "pay-card": CreditCard,
};

/** The icon of a tool, or the icon of its category when the tool has none of its own. */
export function toolIcon(id: ToolId, category: ValueOf<typeof Category>): IconComponent {
  return TOOL_ICONS[id] ?? CATEGORY_ICONS[category];
}
