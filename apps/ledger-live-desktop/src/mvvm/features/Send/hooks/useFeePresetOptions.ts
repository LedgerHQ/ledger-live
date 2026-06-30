import { useMemo } from "react";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { FeePresetOption as DescriptorFeePresetOption } from "@ledgerhq/live-common/bridge/descriptor/types";

export type FeePresetOption = DescriptorFeePresetOption;

export function useFeePresetOptions(
  currency: CryptoOrTokenCurrency | undefined,
  transaction: Transaction,
): readonly FeePresetOption[] {
  return useMemo(
    () => sendFeatures.getFeePresetOptions(currency, transaction),
    [currency, transaction],
  );
}
