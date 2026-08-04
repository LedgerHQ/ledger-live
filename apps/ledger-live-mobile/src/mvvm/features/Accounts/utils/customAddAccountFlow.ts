import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import customAddAccountFlowByFamily from "~/generated/customAddAccountFlow";
import type { ScanDeviceAccountsNavigationProps } from "../screens/ScanDeviceAccounts/types";
import type {
  DeviceSelectionNavigationProps,
  SelectDeviceRouteParams,
} from "../../DeviceSelection/types";
import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";

type ImportAccountsParams = {
  navigation: ScanDeviceAccountsNavigationProps["navigation"];
  routeParams: ScanDeviceAccountsNavigationProps["route"]["params"];
  accountsToAdd: Account[];
};

type DeviceConnectedParams = {
  navigation: DeviceSelectionNavigationProps["navigation"];
  routeParams: SelectDeviceRouteParams & AppResult;
};

type ScanBackParams = {
  navigation: ScanDeviceAccountsNavigationProps["navigation"];
};

export type CustomAddAccountFlow = {
  onImportAccounts?: (params: ImportAccountsParams) => void;
  onDeviceConnected?: (params: DeviceConnectedParams) => void;
  onScanDeviceAccountsBack?: (params: ScanBackParams) => void;
  scanDeviceAccountsCtaI18nKey?: string;
  // Extended account id comparison method for chains where a plain id comparison would fail to recognize a rescanned account as already imported.
  isAlreadyImportedAccount?: (existing: Account, scanned: Account) => boolean;
};

const isCustomAddAccountFlowFamily = (
  family: string,
): family is keyof typeof customAddAccountFlowByFamily =>
  Object.hasOwn(customAddAccountFlowByFamily, family);

export const getCustomAddAccountFlow = (
  currency: CryptoOrTokenCurrency,
): CustomAddAccountFlow | null => {
  if (currency.type !== "CryptoCurrency") return null;
  if (!isCustomAddAccountFlowFamily(currency.family)) return null;
  return customAddAccountFlowByFamily[currency.family];
};
