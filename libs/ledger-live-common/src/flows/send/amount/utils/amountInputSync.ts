import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import {
  formatAmountForInput,
  formatFiatForInput,
  shouldSyncInput,
} from "@ledgerhq/live-common/flows/send/amount/utils/amountInput";

type SyncAmountInputsParams = {
  cryptoAmount: BigNumber;
  fiatAmount: BigNumber;
  transactionUseAllAmount: boolean;
  inputMode: "fiat" | "crypto";
  cryptoInputValue: string;
  fiatInputValue: string;
  locale: string;
  accountUnit: Unit;
  fiatUnit: Unit;
  lastTransactionAmountRef: MutableRefObject<BigNumber | null>;
  lastFiatAmountRef: MutableRefObject<BigNumber | null>;
  lastUseAllAmountRef: MutableRefObject<boolean>;
  lastUserInputTimeRef: MutableRefObject<number>;
  setCryptoInputValue: Dispatch<SetStateAction<string>>;
  setFiatInputValue: Dispatch<SetStateAction<string>>;
};

type SyncFlags = {
  useAllAmountChanged: boolean;
  cryptoAmountChanged: boolean;
  fiatAmountChanged: boolean;
  canSyncWithBridge: boolean;
  isQuickAction: boolean;
  inputsEmptyButHaveAmount: boolean;
};

const INPUT_SYNC_DELAY_MS = 200;

const shouldRunCryptoSync = ({
  cryptoAmountChanged,
  canSyncWithBridge,
  inputsEmptyButHaveAmount,
}: SyncFlags) => (cryptoAmountChanged && canSyncWithBridge) || inputsEmptyButHaveAmount;

const shouldRunFiatSync = ({
  cryptoAmountChanged,
  fiatAmountChanged,
  canSyncWithBridge,
  inputsEmptyButHaveAmount,
}: SyncFlags) =>
  ((cryptoAmountChanged || fiatAmountChanged) && canSyncWithBridge) || inputsEmptyButHaveAmount;

function syncCryptoInput(params: SyncAmountInputsParams, flags: SyncFlags): void {
  if (!shouldRunCryptoSync(flags)) return;

  params.lastTransactionAmountRef.current = params.cryptoAmount;

  const shouldSyncCrypto = shouldSyncInput({
    isQuickAction: flags.isQuickAction,
    useAllAmountChanged: flags.useAllAmountChanged,
    isActiveInput: params.inputMode === "crypto",
    hasInputValue: params.cryptoInputValue.length > 0,
  });

  if (shouldSyncCrypto || flags.inputsEmptyButHaveAmount) {
    const formatted = formatAmountForInput(params.accountUnit, params.cryptoAmount, params.locale);
    params.setCryptoInputValue(formatted);
  }
}

function syncFiatInput(params: SyncAmountInputsParams, flags: SyncFlags): void {
  if (!shouldRunFiatSync(flags)) return;

  params.lastFiatAmountRef.current = params.fiatAmount;

  const shouldSyncFiat = shouldSyncInput({
    isQuickAction: flags.isQuickAction,
    useAllAmountChanged: flags.useAllAmountChanged,
    isActiveInput: params.inputMode === "fiat",
    hasInputValue: params.fiatInputValue.length > 0,
  });

  if (shouldSyncFiat || flags.inputsEmptyButHaveAmount) {
    const formatted = formatFiatForInput(params.fiatUnit, params.fiatAmount, params.locale);
    params.setFiatInputValue(formatted);
  }
}

export function syncAmountInputs(params: SyncAmountInputsParams): void {
  const useAllAmountChanged = params.transactionUseAllAmount !== params.lastUseAllAmountRef.current;
  const lastCrypto = params.lastTransactionAmountRef.current;
  const lastFiat = params.lastFiatAmountRef.current;
  const cryptoAmountChanged =
    lastCrypto === null || !params.cryptoAmount.eq(lastCrypto) || useAllAmountChanged;
  const fiatAmountChanged = lastFiat === null || !params.fiatAmount.eq(lastFiat);
  const timeSinceUserInput = Date.now() - (params.lastUserInputTimeRef.current ?? 0);

  // When useAllAmount is active and amount changes, always sync immediately
  // This handles fee changes that affect the max amount (e.g., switching from medium to fast fees)
  const isUseAllAmountActive = params.transactionUseAllAmount && cryptoAmountChanged;
  const canSyncWithBridge =
    useAllAmountChanged || isUseAllAmountActive || timeSinceUserInput > INPUT_SYNC_DELAY_MS;
  const isQuickAction = params.lastUserInputTimeRef.current === 0;

  // After remount (e.g. back from CustomFees), repopulate inputs explicitly
  const inputsEmptyButHaveAmount =
    params.cryptoAmount.gt(0) &&
    params.cryptoInputValue.length === 0 &&
    params.fiatInputValue.length === 0 &&
    canSyncWithBridge;

  const flags: SyncFlags = {
    useAllAmountChanged,
    cryptoAmountChanged,
    fiatAmountChanged,
    canSyncWithBridge,
    isQuickAction,
    inputsEmptyButHaveAmount,
  };

  // Consume useAllAmount toggle so it doesn't stay true across renders and bypass typing-delay guards
  if (flags.useAllAmountChanged) {
    params.lastUseAllAmountRef.current = params.transactionUseAllAmount;
    params.lastUserInputTimeRef.current = 0;
  }

  syncCryptoInput(params, flags);
  syncFiatInput(params, flags);
}
