import React, { memo, useMemo } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";
import { useTheme } from "styled-components/native";
import { ensureContrast } from "../colors";
import CurrencyIcon from "./CurrencyIcon";

type Props = {
  currency: any;
  size: number;
  hideParentIcon?: boolean;
  borderColor?: string;
};

const ParentCurrencyIcon = ({ currency, size, hideParentIcon = false, borderColor = "background.main" }: Props) => {
  const { colors } = useTheme();
  const color = useMemo(
    () => ensureContrast(getCurrencyColor(currency), colors.constant.white),
    [colors, currency],
  );
  const parentColor = useMemo(() => {
    if (!currency.parentCurrency) {
      return null;
    }
    return ensureContrast(
      getCurrencyColor(currency.parentCurrency),
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
      borderRadius={32}
    >
      <CurrencyIcon
        size={iconSize}
        currency={currency}
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
          borderRadius={32}
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
