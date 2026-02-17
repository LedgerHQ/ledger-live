import type { Dispatch, RefObject, SetStateAction } from "react";
import type { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { formatAmountForInput, formatFiatForInput, shouldSyncInput } from "./amountInput";

export function syncAmountInputs(params: {
  cryptoAmount: BigNumber;
  fiatAmount: BigNumber;
  transactionUseAllAmount: boolean;
  inputMode: "fiat" | "crypto";
  cryptoInputValue: string;
  fiatInputValue: string;
  locale: string;
  accountUnit: Unit;
  fiatUnit: Unit;
  lastTransactionAmountRef: RefObject<BigNumber>;
  lastFiatAmountRef: RefObject<BigNumber>;
  lastUseAllAmountRef: RefObject<boolean>;
  lastUserInputTimeRef: RefObject<number>;
  setCryptoInputValue: Dispatch<SetStateAction<string>>;
  setFiatInputValue: Dispatch<SetStateAction<string>>;
}): void {
  const useAllAmountChanged = params.transactionUseAllAmount !== params.lastUseAllAmountRef.current;
  const cryptoAmountChanged =
    !params.cryptoAmount.eq(params.lastTransactionAmountRef.current) || useAllAmountChanged;
  const fiatAmountChanged = !params.fiatAmount.eq(params.lastFiatAmountRef.current);
  const timeSinceUserInput = Date.now() - params.lastUserInputTimeRef.current;

  // When useAllAmount is active and amount changes, always sync immediately
  // This handles fee changes that affect the max amount (e.g., switching from medium to fast fees)
  const isUseAllAmountActive = params.transactionUseAllAmount && cryptoAmountChanged;
  const canSyncWithBridge = useAllAmountChanged || isUseAllAmountActive || timeSinceUserInput > 200;
  const isQuickAction = params.lastUserInputTimeRef.current === 0;

  if (cryptoAmountChanged && canSyncWithBridge) {
    params.lastTransactionAmountRef.current = params.cryptoAmount;
    if (useAllAmountChanged) {
      params.lastUseAllAmountRef.current = params.transactionUseAllAmount;
      params.lastUserInputTimeRef.current = 0;
    }

    const shouldSync = shouldSyncInput({
      isQuickAction,
      useAllAmountChanged,
      isActiveInput: params.inputMode === "crypto",
      hasInputValue: params.cryptoInputValue.length > 0,
    });

    if (shouldSync) {
      const formatted = formatAmountForInput(
        params.accountUnit,
        params.cryptoAmount,
        params.locale,
      );
      params.setCryptoInputValue(formatted);
    }
  }

  if ((cryptoAmountChanged || fiatAmountChanged) && canSyncWithBridge) {
    params.lastFiatAmountRef.current = params.fiatAmount;

    const shouldSync = shouldSyncInput({
      isQuickAction,
      useAllAmountChanged,
      isActiveInput: params.inputMode === "fiat",
      hasInputValue: params.fiatInputValue.length > 0,
    });

    if (shouldSync) {
      const formatted = formatFiatForInput(params.fiatUnit, params.fiatAmount, params.locale);
      params.setFiatInputValue(formatted);
    }
  }
}
