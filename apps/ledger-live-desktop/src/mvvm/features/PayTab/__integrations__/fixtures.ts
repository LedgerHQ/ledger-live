import type { TokenAccount } from "@ledgerhq/types-live";
import { TokenCurrencySchema } from "@domain/entity-currency-token";
import type { InitializationInput } from "LLD/components/DeviceIntentExecutor";
import {
  BTC_ACCOUNT,
  ETH_ACCOUNT,
  ETH_ACCOUNT_WITH_USDC,
} from "LLD/features/__mocks__/accounts.mock";
import { payCardFeatureTourInitialState } from "@features/flow-pay-feature-tour/state";
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

export const UNISWAP = TokenCurrencySchema.parse({
  type: "TokenCurrency",
  id: "ethereum/erc20/uniswap",
  parentCurrencyId: ETH_ACCOUNT.currency.id,
  contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  tokenType: "erc20",
  ticker: "UNI",
  name: "Uniswap",
  units: [{ name: "Uniswap", code: "UNI", magnitude: 18 }],
});
