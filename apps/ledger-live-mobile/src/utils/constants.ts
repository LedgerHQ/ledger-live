import Config from "react-native-config";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";

export const SYNC_DELAY = 2500;
export const BLE_SCANNING_NOTHING_TIMEOUT = (Config.MOCK ? 60 : 30) * 1000;
export const GENUINE_CHECK_TIMEOUT = 120 * 1000;
export const VIBRATION_PATTERN_ERROR = [0, 150];
export const LEDGER_APPLE_WARNING_EXPLAINER_LINK =
  "https://support.ledger.com/hc/articles/12309873917853?docs=true";
export const PTX_SERVICES_TOAST_ID = "PTX_SERVICES_TOAST_ID";

export const MEMO_TAG_COINS: string[] = [
  "ripple",
  "stellar",
  "cosmos",
  "hedera",
  "injective",
  "crypto_org",
  "crypto_org_croeseid",
  "stacks",
  "ton",
  "eos",
  "bsc",
] satisfies CryptoCurrencyId[];
