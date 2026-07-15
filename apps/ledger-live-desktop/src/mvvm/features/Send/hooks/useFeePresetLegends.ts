import { useMemo } from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  buildFeePresetLegendMap,
  type FeePresetLegendMap,
} from "@ledgerhq/live-common/flows/send/utils/feePresetLegends";
import type { FeePresetOption } from "./useFeePresetOptions";

export type { FeePresetLegendMap };

type Params = Readonly<{
  currency: CryptoOrTokenCurrency | undefined;
  feePresetOptions: readonly FeePresetOption[];
}>;

export function useFeePresetLegends({ currency, feePresetOptions }: Params): FeePresetLegendMap {
  return useMemo(
    () => buildFeePresetLegendMap(currency, feePresetOptions),
    [currency, feePresetOptions],
  );
}
