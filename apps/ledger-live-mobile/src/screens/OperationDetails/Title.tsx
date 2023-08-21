import React, { memo } from "react";
import { StyleProp, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "@react-navigation/native";
import type { NFTMetadataResponse, Operation } from "@ledgerhq/types-live";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import type { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import DoubleCounterValue from "../../components/DoubleCountervalue";
import Skeleton from "../../components/Skeleton";
import LText from "../../components/LText";

type Props = {
  hasFailed: boolean;
  amount: BigNumber;
  operation: Operation;
  currency: Currency;
  unit: Unit;
  isNftOperation: boolean;
  status: string;
  metadata: NFTMetadataResponse["result"];
  styles: Record<string, StyleProp<ViewStyle | TextStyle>>;
};

const Title = ({
  operation,
  hasFailed,
  amount,
  isNftOperation,
  currency,
  unit,
  status,
  metadata,
  styles,
}: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isNegative = amount.isNegative();
  const valueColor = isNegative ? colors.smoke : colors.green;

  if (isNftOperation) {
    return (
      <>
        <Skeleton
          style={[styles.currencyUnitValue, styles.currencyUnitValueSkeleton]}
          loading={status === "loading"}
        >
          <LText semiBold numberOfLines={1} style={styles.currencyUnitValue}>
            {metadata?.nftName || "-"}
          </LText>
        </Skeleton>
        <LText
          numberOfLines={1}
          ellipsizeMode="middle"
          style={[
            styles.titleTokenId,
            {
              color: colors.grey,
            },
          ]}
        >
          {t("common.patterns.id", { value: operation.tokenId })}
        </LText>
      </>
    );
  }

  if (hasFailed || amount.isZero()) {
    return null;
  }

  return (
    <>
      <LText
        semiBold
        numberOfLines={1}
        style={[
          styles.currencyUnitValue,
          {
            color: valueColor,
          },
        ]}
      >
        <CurrencyUnitValue
          showCode
          disableRounding={true}
          unit={unit}
          value={amount}
          alwaysShowSign
        />
      </LText>
      <DoubleCounterValue
        showCode
        alwaysShowSign
        currency={currency}
        value={amount}
        date={operation.date}
        subMagnitude={1}
      />
    </>
  );
};

export default memo(Title);
