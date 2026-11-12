import { useCallback, useState } from "react";
import type BigNumber from "bignumber.js";
import type { Unit } from "@domain/entity-currency-unit";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";

// AmountInput groups thousands with spaces, which parseCurrencyUnit reads as NaN
function parseLimit(unit: Unit, text: string) {
  return parseCurrencyUnit(unit, text.replaceAll(" ", ""));
}

export function useTrustLimitInput({
  unit,
  maxLimit,
  initial,
  onLimitChange,
}: Readonly<{
  unit: Unit;
  maxLimit: BigNumber;
  initial: Readonly<{ isMaximum: boolean; limitText: string; isRippling: boolean }>;
  onLimitChange: (limit: BigNumber) => void;
}>) {
  const [isMaximum, setIsMaximum] = useState(initial.isMaximum);
  const [limitText, setLimitText] = useState(initial.limitText);
  const [isLimitEdited, setIsLimitEdited] = useState(false);
  // UI only: the transaction has no rippling field until coin-xrp supports it
  const [isRippling, setIsRippling] = useState(initial.isRippling);
  const [isMaxLimitInfoOpen, setIsMaxLimitInfoOpen] = useState(false);

  const typedLimit = parseLimit(unit, limitText);
  const isTypingLimit = isLimitEdited && !isMaximum;
  const hasTypedLimit = isTypingLimit && limitText !== "";

  const onChangeUseMax = useCallback(
    (useMax: boolean) => {
      setIsMaximum(useMax);
      onLimitChange(useMax ? maxLimit : typedLimit);
    },
    [maxLimit, onLimitChange, typedLimit],
  );

  const onChangeLimitText = useCallback(
    (text: string) => {
      setLimitText(text);
      setIsLimitEdited(true);
      onLimitChange(parseLimit(unit, text));
    },
    [onLimitChange, unit],
  );

  const onOpenMaxLimitInfo = useCallback(() => setIsMaxLimitInfoOpen(true), []);
  const onCloseMaxLimitInfo = useCallback(() => setIsMaxLimitInfoOpen(false), []);

  return {
    isMaximum,
    isRippling,
    isMaxLimitInfoOpen,
    hasTypedLimit,
    onChangeUseMax,
    onChangeLimitText,
    onOpenMaxLimitInfo,
    onCloseMaxLimitInfo,
    limit: isMaximum ? maxLimit : typedLimit,
    limitText: isMaximum ? maxLimit.shiftedBy(-unit.magnitude).toFixed() : limitText,
    onChangeRippling: setIsRippling,
  };
}
