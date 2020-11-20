// @flow
import { createCustomErrorClass } from "@ledgerhq/errors";

// TODO we need to migrate in all errors that are in @ledgerhq/errors
// but only make sense to live-common to not pollute ledgerjs

export const ConnectAppTimeout = createCustomErrorClass("ConnectAppTimeout");

export const ConnectManagerTimeout = createCustomErrorClass(
  "ConnectManagerTimeout"
);

export const FeeEstimationFailed = createCustomErrorClass(
  "FeeEstimationFailed"
);

export const LowerThanMinimumRelayFee = createCustomErrorClass(
  "LowerThanMinimumRelayFee"
);

export const TransactionRefusedOnDevice = createCustomErrorClass(
  "TransactionRefusedOnDevice"
);

export const TronNoFrozenForBandwidth = createCustomErrorClass(
  "TronNoFrozenForBandwidth"
);

export const TronNoFrozenForEnergy = createCustomErrorClass(
  "TronNoFrozenForEnergy"
);
export const TronUnfreezeNotExpired = createCustomErrorClass(
  "TronUnfreezeNotExpired"
);

export const TronVoteRequired = createCustomErrorClass("TronVoteRequired");

export const TronInvalidVoteCount = createCustomErrorClass(
  "TronInvalidVoteCount"
);

export const TronRewardNotAvailable = createCustomErrorClass(
  "TronRewardNotAvailable"
);

export const TronNoReward = createCustomErrorClass("TronNoReward");

export const TronInvalidFreezeAmount = createCustomErrorClass(
  "TronInvalidFreezeAmount"
);

export const TronSendTrc20ToNewAccountForbidden = createCustomErrorClass(
  "TronSendTrc20ToNewAccountForbidden"
);

export const TronUnexpectedFees = createCustomErrorClass("TronUnexpectedFees");

export const TronNotEnoughTronPower = createCustomErrorClass(
  "TronNotEnoughTronPower"
);

export const TronTransactionExpired = createCustomErrorClass(
  "TronTransactionExpired"
);

export const TronNotEnoughEnergy = createCustomErrorClass(
  "TronNotEnoughEnergy"
);

export const StellarMemoRecommended = createCustomErrorClass(
  "StellarMemoRecommended"
);

export const StellarWrongMemoFormat = createCustomErrorClass(
  "StellarWrongMemoFormat"
);

export const AccountAwaitingSendPendingOperations = createCustomErrorClass(
  "AccountAwaitingSendPendingOperations"
);

export const SourceHasMultiSign = createCustomErrorClass("SourceHasMultiSign");

export const CosmosRedelegationInProgress = createCustomErrorClass(
  "CosmosRedelegationInProgress"
);

export const ClaimRewardsFeesWarning = createCustomErrorClass(
  "ClaimRewardsFeesWarning"
);

export const CosmosDelegateAllFundsWarning = createCustomErrorClass(
  "CosmosDelegateAllFundsWarning"
);

export const CosmosTooManyValidators = createCustomErrorClass(
  "CosmosTooManyValidators"
);

export const NotEnoughDelegationBalance = createCustomErrorClass(
  "NotEnoughDelegationBalance"
);

export const RPCFieldRequired = createCustomErrorClass("RPCFieldRequired");

// Note : info of this code can be found here :
// https://github.com/cosmos/cosmos-sdk/blob/v0.37.9/types/errors.go#L28
export const CosmosBroadcastError = {
  "0": createCustomErrorClass("CosmosBroadcastCodeOK"),
  "1": createCustomErrorClass("CosmosBroadcastCodeInternal"),
  "2": createCustomErrorClass("CosmosBroadcastCodeTxDecode"),
  "3": createCustomErrorClass("CosmosBroadcastCodeInvalidSequence"),
  "4": createCustomErrorClass("CosmosBroadcastCodeUnauthorized"),
  "5": createCustomErrorClass("CosmosBroadcastCodeInsufficientFunds"),
  "6": createCustomErrorClass("CosmosBroadcastCodeUnknownRequest"),
  "7": createCustomErrorClass("CosmosBroadcastCodeInvalidAddress"),
  "8": createCustomErrorClass("CosmosBroadcastCodeInvalidPubKey"),
  "9": createCustomErrorClass("CosmosBroadcastCodeUnknownAddress"),
  "10": createCustomErrorClass("CosmosBroadcastCodeInsufficientCoins"),
  "11": createCustomErrorClass("CosmosBroadcastCodeInvalidCoins"),
  "12": createCustomErrorClass("CosmosBroadcastCodeOutOfGas"),
  "13": createCustomErrorClass("CosmosBroadcastCodeMemoTooLarge"),
  "14": createCustomErrorClass("CosmosBroadcastCodeInsufficientFee"),
  "15": createCustomErrorClass("CosmosBroadcastCodeTooManySignatures"),
  "16": createCustomErrorClass("CosmosBroadcastCodeGasOverflow"),
  "17": createCustomErrorClass("CosmosBroadcastCodeNoSignatures"),
};

export const SatStackAccessDown = createCustomErrorClass("SatStackAccessDown");
export const SatStackStillSyncing = createCustomErrorClass(
  "SatStackStillSyncing"
);

export const SwapNoAvailableProviders = createCustomErrorClass(
  "SwapNoAvailableProviders"
);

export const SwapExchangeRateAmountTooLow = createCustomErrorClass(
  "SwapExchangeRateAmountTooLow"
);

export const SwapExchangeRateAmountTooHigh = createCustomErrorClass(
  "SwapExchangeRateAmountTooHigh"
);

export const SwapUnknownSwapId = createCustomErrorClass("SwapUnknownSwapId");

export const SwapGenericAPIError = createCustomErrorClass(
  "SwapGenericAPIError"
);

export const AlgorandASANotOptInInRecipient = createCustomErrorClass(
  "AlgorandASANotOptInInRecipient"
);

export const CompoundLowerAllowanceOfActiveAccountError = createCustomErrorClass(
  "CompoundLowerAllowanceOfActiveAccountError"
);
