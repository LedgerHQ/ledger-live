import React, { memo, useMemo } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useTheme } from "styled-components/native";
import { Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ensureContrast } from "../colors";
import CurrencyIcon from "./CurrencyIcon";

type Props = {
  currency: Currency;
  size: number;
  hideParentIcon?: boolean;
  borderColor?: string;
  forceIconScale?: number;
};

const ParentCurrencyIcon = ({
  currency,
  size,
  hideParentIcon = false,
  borderColor = "background.main",
  forceIconScale = 1,
}: Props) => {
  const { colors } = useTheme();
  const color = useMemo(
    () => ensureContrast(getCurrencyColor(currency), colors.constant.white),
    [colors, currency],
  );
  const parentColor = useMemo(() => {
    if (!(currency as TokenCurrency).parentCurrency) {
      return null;
    }
    return ensureContrast(
      getCurrencyColor((currency as TokenCurrency).parentCurrency),
      colors.constant.white,
    );
  }, [colors, currency]);

  const iconSize = size * 0.625;
  const parentIconBorderWidth = 2;
  const parentIconCircleSize = size * 0.375 + parentIconBorderWidth * 2;
  const parentIconSize = size * 0.25;

  return (
    <Flex
      bg={color}
      width={size}
      height={size}
      alignItems={"center"}
      justifyContent={"center"}
      borderRadius={size}
    >
      <CurrencyIcon
        size={iconSize}
        currency={currency}
        forceIconScale={forceIconScale}
        color={colors.constant.white}
      />
      {!hideParentIcon && currency.type === "TokenCurrency" && (
        <Flex
          position={"absolute"}
          left={size - parentIconCircleSize + parentIconBorderWidth}
          // Border width offset
          bottom={parentIconBorderWidth * -1}
          bg={parentColor}
          width={parentIconCircleSize}
          height={parentIconCircleSize}
          alignItems={"center"}
          justifyContent={"center"}
          borderRadius={size}
          borderWidth={parentIconBorderWidth}
          borderColor={borderColor}
        >
          <CurrencyIcon
            size={parentIconSize}
            currency={currency.parentCurrency}
            color={colors.constant.white}
          />
        </Flex>
      )}
    </Flex>
  );
};

export default memo<Props>(ParentCurrencyIcon);
