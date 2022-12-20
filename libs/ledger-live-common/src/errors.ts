import { createCustomErrorClass } from "@ledgerhq/errors";

export * from "@ledgerhq/coin-framework/lib/errors";
export * from "./families/polkadot/errors";
export * from "./families/stellar/errors";
export * from "./families/solana/errors";
export * from "./families/cardano/errors";
export * from "./families/near/errors";

// Tron Error
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

// Cosmos Error
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
// Note : info of this code can be found here :
// https://github.com/cosmos/cosmos-sdk/blob/v0.40.0-rc3/types/errors/errors.go#L16
export const CosmosBroadcastError = {
  "1": createCustomErrorClass("CosmosBroadcastCodeInternal"),
  "2": createCustomErrorClass("CosmosBroadcastCodeTxDecode"),
  "3": createCustomErrorClass("CosmosBroadcastCodeInvalidSequence"),
  "4": createCustomErrorClass("CosmosBroadcastCodeUnauthorized"),
  "5": createCustomErrorClass("CosmosBroadcastCodeInsufficientFunds"),
  "6": createCustomErrorClass("CosmosBroadcastCodeUnknownRequest"),
  "7": createCustomErrorClass("CosmosBroadcastCodeInvalidAddress"),
  "8": createCustomErrorClass("CosmosBroadcastCodeInvalidPubKey"),
  "9": createCustomErrorClass("CosmosBroadcastCodeUnknownAddress"),
  "10": createCustomErrorClass("CosmosBroadcastCodeInvalidCoins"),
  "11": createCustomErrorClass("CosmosBroadcastCodeOutOfGas"),
  "12": createCustomErrorClass("CosmosBroadcastCodeMemoTooLarge"),
  "13": createCustomErrorClass("CosmosBroadcastCodeInsufficientFee"),
  "14": createCustomErrorClass("CosmosBroadcastCodeTooManySignatures"),
  "15": createCustomErrorClass("CosmosBroadcastCodeNoSignatures"),
  "16": createCustomErrorClass("CosmosBroadcastCodeJSONMarshal"),
  "17": createCustomErrorClass("CosmosBroadcastCodeJSONUnmarshal"),
  "18": createCustomErrorClass("CosmosBroadcastCodeInvalidRequest"),
  "19": createCustomErrorClass("CosmosBroadcastCodeTxInMempoolCache"),
  "20": createCustomErrorClass("CosmosBroadcastCodeMempoolIsFull"),
  "21": createCustomErrorClass("CosmosBroadcastTxTooLarge"),
  "22": createCustomErrorClass("CosmosBroadcastKeyNotFound"),
  "23": createCustomErrorClass("CosmosBroadcastWrongPassword"),
  "24": createCustomErrorClass("CosmosBroadcastInvalidSigner"),
  "25": createCustomErrorClass("CosmosBroadcastInvalidGasAdjustment"),
  "26": createCustomErrorClass("CosmosBroadcastInvalidHeight"),
  "27": createCustomErrorClass("CosmosBroadcastInvalidVersion"),
  "28": createCustomErrorClass("CosmosBroadcastInvalidChainID"),
  "29": createCustomErrorClass("CosmosBroadcastInvalidType"),
  "30": createCustomErrorClass("CosmosBroadcastTimeoutHeight"),
  "31": createCustomErrorClass("CosmosBroadcastUnknownExtensionOptions"),
  "32": createCustomErrorClass("CosmosBroadcastWrongSequence"),
  "33": createCustomErrorClass("CosmosBroadcastPackAny"),
  "34": createCustomErrorClass("CosmosBroadcastUnpackAny"),
  "35": createCustomErrorClass("CosmosBroadcastLogic"),
  "36": createCustomErrorClass("CosmosBroadcastConflict"),
};

// SatStack
export const SatStackVersionTooOld = createCustomErrorClass(
  "SatStackVersionTooOld"
);
export const SatStackAccessDown = createCustomErrorClass("SatStackAccessDown");
export const SatStackStillSyncing = createCustomErrorClass(
  "SatStackStillSyncing"
);
export const SatStackDescriptorNotImported = createCustomErrorClass(
  "SatStackDescriptorNotImported"
);

// Algorand
export const AlgorandASANotOptInInRecipient = createCustomErrorClass(
  "AlgorandASANotOptInInRecipient"
);
