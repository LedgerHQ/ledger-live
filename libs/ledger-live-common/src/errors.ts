// TODO we need to migrate in all errors that are in @ledgerhq/errors
// but only make sense to live-common to not pollute ledgerjs

class FieldsError extends Error {
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class ConnectAppTimeout extends Error {
  override name = "ConnectAppTimeout";
  constructor(message = "ConnectAppTimeout") {
    super(message);
  }
}
export class ConnectManagerTimeout extends FieldsError {
  override name = "ConnectManagerTimeout";
}
export class GetAppAndVersionUnsupportedFormat extends Error {
  override name = "GetAppAndVersionUnsupportedFormat";
  constructor(message = "GetAppAndVersionUnsupportedFormat") {
    super(message);
  }
}

export class FeeEstimationFailed extends FieldsError {
  override name = "FeeEstimationFailed";
}
export class TransactionRefusedOnDevice extends Error {
  override name = "TransactionRefusedOnDevice";
  constructor(message = "TransactionRefusedOnDevice") {
    super(message);
  }
}

export class LanguageInstallRefusedOnDevice extends Error {
  override name = "LanguageInstallRefusedOnDevice";
  constructor(message = "LanguageInstallRefusedOnDevice") {
    super(message);
  }
}

export class ImageLoadRefusedOnDevice extends FieldsError {
  override name = "ImageLoadRefusedOnDevice";
}

export class ImageDoesNotExistOnDevice extends FieldsError {
  override name = "ImageDoesNotExistOnDevice";
}

export class ImageCommitRefusedOnDevice extends FieldsError {
  override name = "ImageCommitRefusedOnDevice";
}

export class LanguageInstallTimeout extends Error {
  override name = "LanguageInstallTimeout";
  constructor(message = "LanguageInstallTimeout") {
    super(message);
  }
}

export class DeviceOnboarded extends Error {
  override name = "DeviceOnboarded";
  constructor(message = "DeviceOnboarded") {
    super(message);
  }
}
export class DeviceNotOnboarded extends Error {
  override name = "DeviceNotOnboarded";
  constructor(message = "DeviceNotOnboarded") {
    super(message);
  }
}
export class DeviceAlreadySetup extends FieldsError {
  override name = "DeviceAlreadySetup";
}

export class SourceHasMultiSign extends Error {
  override name = "SourceHasMultiSign";
  constructor(message = "SourceHasMultiSign") {
    super(message);
  }
}

// Note : info of this code can be found here :
// https://github.com/cosmos/cosmos-sdk/blob/v0.40.0-rc3/types/errors/errors.go#L16
export const CosmosBroadcastError = {
  "1": class extends Error {
    override name = "CosmosBroadcastCodeInternal";
  },
  "2": class extends Error {
    override name = "CosmosBroadcastCodeTxDecode";
  },
  "3": class extends Error {
    override name = "CosmosBroadcastCodeInvalidSequence";
  },
  "4": class extends Error {
    override name = "CosmosBroadcastCodeUnauthorized";
  },
  "5": class extends Error {
    override name = "CosmosBroadcastCodeInsufficientFunds";
  },
  "6": class extends Error {
    override name = "CosmosBroadcastCodeUnknownRequest";
  },
  "7": class extends Error {
    override name = "CosmosBroadcastCodeInvalidAddress";
  },
  "8": class extends Error {
    override name = "CosmosBroadcastCodeInvalidPubKey";
  },
  "9": class extends Error {
    override name = "CosmosBroadcastCodeUnknownAddress";
  },
  "10": class extends Error {
    override name = "CosmosBroadcastCodeInvalidCoins";
  },
  "11": class extends Error {
    override name = "CosmosBroadcastCodeOutOfGas";
  },
  "12": class extends Error {
    override name = "CosmosBroadcastCodeMemoTooLarge";
  },
  "13": class extends Error {
    override name = "CosmosBroadcastCodeInsufficientFee";
  },
  "14": class extends Error {
    override name = "CosmosBroadcastCodeTooManySignatures";
  },
  "15": class extends Error {
    override name = "CosmosBroadcastCodeNoSignatures";
  },
  "16": class extends Error {
    override name = "CosmosBroadcastCodeJSONMarshal";
  },
  "17": class extends Error {
    override name = "CosmosBroadcastCodeJSONUnmarshal";
  },
  "18": class extends Error {
    override name = "CosmosBroadcastCodeInvalidRequest";
  },
  "19": class extends Error {
    override name = "CosmosBroadcastCodeTxInMempoolCache";
  },
  "20": class extends Error {
    override name = "CosmosBroadcastCodeMempoolIsFull";
  },
  "21": class extends Error {
    override name = "CosmosBroadcastTxTooLarge";
  },
  "22": class extends Error {
    override name = "CosmosBroadcastKeyNotFound";
  },
  "23": class extends Error {
    override name = "CosmosBroadcastWrongPassword";
  },
  "24": class extends Error {
    override name = "CosmosBroadcastInvalidSigner";
  },
  "25": class extends Error {
    override name = "CosmosBroadcastInvalidGasAdjustment";
  },
  "26": class extends Error {
    override name = "CosmosBroadcastInvalidHeight";
  },
  "27": class extends Error {
    override name = "CosmosBroadcastInvalidVersion";
  },
  "28": class extends Error {
    override name = "CosmosBroadcastInvalidChainID";
  },
  "29": class extends Error {
    override name = "CosmosBroadcastInvalidType";
  },
  "30": class extends Error {
    override name = "CosmosBroadcastTimeoutHeight";
  },
  "31": class extends Error {
    override name = "CosmosBroadcastUnknownExtensionOptions";
  },
  "32": class extends Error {
    override name = "CosmosBroadcastWrongSequence";
  },
  "33": class extends Error {
    override name = "CosmosBroadcastPackAny";
  },
  "34": class extends Error {
    override name = "CosmosBroadcastUnpackAny";
  },
  "35": class extends Error {
    override name = "CosmosBroadcastLogic";
  },
  "36": class extends Error {
    override name = "CosmosBroadcastConflict";
  },
};
export class SwapNoAvailableProviders extends Error {
  override name = "SwapNoAvailableProviders";
  constructor(message = "SwapNoAvailableProviders") {
    super(message);
  }
}
export class NoSuchAppOnProvider extends FieldsError {
  override name = "NoSuchAppOnProvider";
}
export class SwapExchangeRateAmountTooLow extends FieldsError {
  override name = "SwapExchangeRateAmountTooLow";
}
export class SwapExchangeRateAmountTooHigh extends FieldsError {
  override name = "SwapExchangeRateAmountTooHigh";
}
export class SwapExchangeRateAmountTooLowOrTooHigh extends FieldsError {
  override name = "SwapExchangeRateAmountTooLowOrTooHigh";
}

export class SwapGenericAPIError extends Error {
  override name = "SwapGenericAPIError";
  constructor(message = "SwapGenericAPIError") {
    super(message);
  }
}
export class SwapRateExpiredError extends Error {
  override name = "SwapRateExpiredError";
  constructor(message = "SwapRateExpiredError") {
    super(message);
  }
}

export class JSONRPCResponseError extends Error {
  override name = "JSONRPCResponseError";
  constructor(message = "JSONRPCResponseError") {
    super(message);
  }
}
export class JSONDecodeError extends Error {
  override name = "JSONDecodeError";
  constructor(message = "JSONDecodeError") {
    super(message);
  }
}
export class NoIPHeaderError extends Error {
  override name = "NoIPHeaderError";
  constructor(message = "NoIPHeaderError") {
    super(message);
  }
}
export class CurrencyNotSupportedError extends Error {
  override name = "CurrencyNotSupportedError";
  constructor(message = "CurrencyNotSupportedError") {
    super(message);
  }
}
export class CurrencyDisabledError extends Error {
  override name = "CurrencyDisabledError";
  constructor(message = "CurrencyDisabledError") {
    super(message);
  }
}
export class CurrencyDisabledAsInputError extends Error {
  override name = "CurrencyDisabledAsInputError";
  constructor(message = "CurrencyDisabledAsInputError") {
    super(message);
  }
}
export class CurrencyDisabledAsOutputError extends Error {
  override name = "CurrencyDisabledAsOutputError";
  constructor(message = "CurrencyDisabledAsOutputError") {
    super(message);
  }
}
export class CurrencyNotSupportedByProviderError extends Error {
  override name = "CurrencyNotSupportedByProviderError";
  constructor(message = "CurrencyNotSupportedByProviderError") {
    super(message);
  }
}
export class TradeMethodNotSupportedError extends Error {
  override name = "TradeMethodNotSupportedError";
  constructor(message = "TradeMethodNotSupportedError") {
    super(message);
  }
}
export class UnexpectedError extends Error {
  override name = "UnexpectedError";
  constructor(message = "UnexpectedError") {
    super(message);
  }
}
export class NotImplementedError extends Error {
  override name = "NotImplementedError";
  constructor(message = "NotImplementedError") {
    super(message);
  }
}
export class ValidationError extends Error {
  override name = "ValidationError";
  constructor(message = "ValidationError") {
    super(message);
  }
}
export class AccessDeniedError extends Error {
  override name = "AccessDeniedError";
  constructor(message = "AccessDeniedError") {
    super(message);
  }
}
export class OutdatedApp extends Error {
  override name = "OutdatedApp";
  constructor(message = "OutdatedApp") {
    super(message);
  }
}

export class BluetoothNotSupportedError extends Error {
  override name = "FwUpdateBluetoothNotSupported";
  constructor(message = "FwUpdateBluetoothNotSupported") {
    super(message);
  }
}

export class EConnResetError extends Error {
  override name = "EConnReset";
  constructor(message = "EConnReset") {
    super(message);
  }
}

export { ClaimRewardsFeesWarning } from "@ledgerhq/errors";
export * from "@ledgerhq/coin-module-framework/errors";
export * from "@ledgerhq/coin-algorand/errors";
export * from "@ledgerhq/coin-aptos/errors";
export * from "@ledgerhq/coin-bitcoin/errors";
export * from "@ledgerhq/coin-cardano/errors";
export * from "@ledgerhq/coin-cosmos/errors";
export * from "@ledgerhq/coin-evm/errors";
export * from "@ledgerhq/coin-hedera/errors";
export * from "@ledgerhq/coin-celo/errors";
export * from "@ledgerhq/coin-filecoin/errors";
export * from "@ledgerhq/coin-near/errors";
export * from "@ledgerhq/coin-polkadot/errors";
export * from "@ledgerhq/coin-solana/errors";
export * from "@ledgerhq/coin-stacks/errors";
export * from "@ledgerhq/coin-stellar/errors";
export * from "@ledgerhq/coin-tezos/errors";
export * from "@ledgerhq/coin-vechain/errors";
