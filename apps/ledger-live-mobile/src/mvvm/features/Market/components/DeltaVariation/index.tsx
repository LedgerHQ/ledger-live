import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import { getTrendSign, getTrendTone } from "@shared/trend";
import React from "react";

type Props = {
  value: number;
  percent?: boolean;
};

const DELTA_DECIMALS = 2;

function DeltaVariation({ value, percent, ...props }: Props) {
  const delta = value;

  if (Number.isNaN(delta)) {
    return null;
  }

  const absDelta = Math.abs(delta);

  const tone = getTrendTone(delta, { decimals: DELTA_DECIMALS });

  if (tone === "neutral") {
    return (
      <Text variant="large" color="neutral.c60" fontWeight="semiBold">
        &minus;
      </Text>
    );
  }

  const [color, ArrowIcon] =
    tone === "positive"
      ? (["success.c50", IconsLegacy.ArrowEvolutionUpMedium] as const)
      : (["error.c50", IconsLegacy.ArrowEvolutionDownMedium] as const);
  const sign = getTrendSign(delta, { decimals: DELTA_DECIMALS });
  return (
    <Flex flexDirection="row" alignItems="center">
      {percent ? <ArrowIcon size={20} color={color} /> : null}
      <Text variant="body" ml={2} fontWeight="semiBold" color={color} {...props}>
        {percent ? `${absDelta.toFixed(2)}%` : `${sign}${absDelta}`}
      </Text>
    </Flex>
  );
}

export default DeltaVariation;
