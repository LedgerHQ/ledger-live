import React, { memo } from "react";

import { useTheme } from "@react-navigation/native";

import type {
  NFTMetadataResponse,
  Operation,
  Currency,
  Unit,
} from "@ledgerhq/live-common/types/index";
import type { BigNumber } from "bignumber.js";

import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import DoubleCounterValue from "../../components/DoubleCountervalue";
import Skeleton from "../../components/Skeleton";
import LText from "../../components/LText";

type Props = {
  hasFailed: Boolean,
  amount: BigNumber,
  operation: Operation,
  currency: Currency,
  unit: Unit,
  isNftOperation: Boolean,
  status: string,
  metadata: $PropertyType<NFTMetadataResponse, "result">,
  styles: Object,
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
          style={[styles.titleTokenId, { color: colors.grey }]}
        >
          ID {operation.tokenId}
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
        style={[styles.currencyUnitValue, { color: valueColor }]}
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

// $FlowFixMe
export default memo(Title);
