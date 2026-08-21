import type { TokenAccount } from "@ledgerhq/types-live";
import type { InitializationInput } from "LLD/components/DeviceIntentExecutor";
import { BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";
import { payCardFeatureTourInitialState } from "@features/flow-pay-card-feature-tour/state";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { withFlagOverrides } from "tests/testSetup";
import type { PayStablecoins } from "../hooks/usePayStablecoins";
import { USDC, USDT } from "../hooks/__tests__/fixtures";

export const EMPTY_TITLE = "Pay and get paid";
export const EMPTY_DESCRIPTION = "Start by depositing stablecoin to your wallet";
export const FEATURE_TOUR_ROW = "Minimal volatility";

export const onboardedState = { settings: { ...AFTER_ONBOARDING_STATE, counterValue: "USD" } };

export const tourSeenState = {
  payCardFeatureTour: { ...payCardFeatureTourInitialState, hasSeenFeatureTour: true },
};

export const fundedState = {
  ...onboardedState,
  ...tourSeenState,
  accounts: [BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC],
};

export const dieEnabledState = {
  ...fundedState,
  ...withFlagOverrides({ ldmkTransport: { enabled: true } }),
};

export const newSendFlowEnabledState = {
  ...fundedState,
  ...withFlagOverrides({
    newSendFlow: { enabled: true, params: { families: ["evm"], excludedCurrencyIds: [] } },
  }),
};

export const defaultPayStablecoins: PayStablecoins = {
  stablecoins: [],
  defaultStablecoins: [USDC, USDT],
  isLoading: false,
  isError: false,
};

export const INIT_INPUT = { appName: "Ethereum" } as InitializationInput;

export const USDC_TOKEN = ETH_ACCOUNT_WITH_USDC.subAccounts![0] as TokenAccount;
