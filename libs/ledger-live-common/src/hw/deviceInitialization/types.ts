import type { Account, DerivationMode } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { FlowName } from "../../device-action/utils";

export type RequiresDerivation = {
  currencyId: string;
  path: string;
  derivationMode: DerivationMode;
  forceFormat?: string;
};

export type ExpectedAccountIdentity = {
  accountName: string;
  acceptableDerivedAddresses: string[];
};

export type DeprecationPresentationInput = {
  flow: FlowName;
  currencyName: string;
};

export type AppRequestInput = {
  appName?: string;
  currency?: CryptoCurrency | null;
  account?: Account;
  tokenCurrency?: TokenCurrency;
  dependencies?: AppRequestInput[];
  withInlineInstallProgress?: boolean;
  requireLatestFirmware?: boolean;
  allowPartialDependencies?: boolean;
};

export type ConnectAppInitializationInput = {
  appName: string;
  dependencies: string[];
  requireLatestFirmware: boolean;
  allowPartialDependencies: boolean;
  requiresDerivation?: RequiresDerivation;
  expectedAccount?: ExpectedAccountIdentity;
  deprecation?: DeprecationPresentationInput;
};
