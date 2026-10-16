import { BigNumber } from "bignumber.js";
import { AccountLike } from "@ledgerhq/types-live";

export const getCustomFeesPerFamily = transaction => {
  const { family, maxFeePerGas, maxPriorityFeePerGas, fees, gasPrice } = transaction;

  switch (family) {
    case "evm": {
      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasPrice,
      };
    }
    case "bitcoin": {
      // the swap live app is handed the legacy shape: the rate in use (the last estimation's, or
      // the custom one) as a BigNumber, and the coin selection
      const { feePerByte: customFeePerByte, utxoStrategy } = transaction.familySpecificData ?? {};
      const feePerByte = transaction.feeParameters?.feePerByte ?? customFeePerByte;
      return {
        feePerByte: feePerByte === undefined ? undefined : new BigNumber(feePerByte),
        utxoStrategy,
      };
    }
    default:
      return {
        fees,
      };
  }
};

/**
 * The fee settings the swap live app sends back for a bitcoin transaction — the shape
 * `getCustomFeesPerFamily` hands it — as the transaction carries them: user choices, in
 * `familySpecificData`, the rate as a decimal string.
 */
export const getBitcoinCustomFeesPatch = (
  transaction: { familySpecificData?: Record<string, unknown> },
  customFeeConfig: Record<string, unknown> | null | undefined,
): { familySpecificData: Record<string, unknown> } => {
  const { feePerByte, utxoStrategy } = customFeeConfig ?? {};
  const rate =
    feePerByte === undefined || feePerByte === null
      ? null
      : new BigNumber(feePerByte as BigNumber.Value);
  return {
    familySpecificData: {
      ...transaction.familySpecificData,
      ...(rate && !rate.isNaN() ? { feePerByte: rate.toFixed() } : {}),
      ...(utxoStrategy ? { utxoStrategy } : {}),
    },
  };
};

export const convertToNonAtomicUnit = ({
  amount,
  account,
}: {
  amount?: BigNumber;
  account: AccountLike;
}) => {
  const fromMagnitude =
    account.type === "TokenAccount"
      ? account.token.units[0].magnitude || 0
      : account.currency?.units[0].magnitude || 0;
  return amount?.shiftedBy(-fromMagnitude);
};

export const convertToAtomicUnit = ({
  amount,
  account,
}: {
  amount?: BigNumber;
  account: AccountLike;
}) => {
  const fromMagnitude =
    account.type === "TokenAccount"
      ? account.token.units[0].magnitude || 0
      : account.currency?.units[0].magnitude || 0;
  return amount?.shiftedBy(fromMagnitude);
};
