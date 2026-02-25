import React, { memo } from "react";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { PortfolioRange, ValueChange } from "@ledgerhq/types-live";
import { Text, Box } from "@ledgerhq/lumen-ui-rnative";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useDelta } from "./useDelta";

type Props = {
  valueChange: ValueChange;
  percent?: boolean;
  unit?: Unit;
  range?: PortfolioRange;
  lx?: LumenViewStyle;
  /** whether to still render something for a 0% variation */
  show0Delta?: boolean;
  /** whether to show a placeholder in case the percent value is not valid */
  fallbackToPercentPlaceholder?: boolean;
  isPercentSignDisplayed?: boolean;
  isArrowDisplayed?: boolean;
  testID?: string;
};

function Delta({
  valueChange,
  percent,
  unit,
  range,
  lx,
  show0Delta,
  fallbackToPercentPlaceholder,
  isPercentSignDisplayed = false,
  isArrowDisplayed = true,
  testID,
}: Readonly<Props>) {
  const deltaData = useDelta({
    valueChange,
    percent,
    unit,
    range,
    show0Delta,
    isPercentSignDisplayed,
    isArrowDisplayed,
  });

  if (!deltaData) {
    return fallbackToPercentPlaceholder ? (
      // eslint-disable-next-line i18next/no-literal-string
      <Text typography="body2" lx={{ color: "base" }}>
        &minus;
      </Text>
    ) : null;
  }

  const renderDeltaValue = () => {
    if (deltaData.hasUnit && unit) {
      return (
        <CurrencyUnitValue
          before={deltaData.currencyBefore}
          after={deltaData.currencyAfter}
          unit={unit}
          value={deltaData.absDelta}
        />
      );
    }
    if (percent) {
      return deltaData.percentValue;
    }
    return null;
  };

  return (
    <Box lx={{ ...BoxStyle, ...lx }}>
      <Text typography="body2" testID={testID} lx={{ color: deltaData.color }}>
        {deltaData.arrowPrefix}
        {renderDeltaValue()}
        {deltaData.rangeText}
        {deltaData.percentSign}
      </Text>
    </Box>
  );
}

const BoxStyle: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
};

export default memo<Props>(Delta);
