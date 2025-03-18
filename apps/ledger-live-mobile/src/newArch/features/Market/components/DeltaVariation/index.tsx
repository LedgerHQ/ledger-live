import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import React from "react";

type Props = {
  value: number;
  percent?: boolean;
};

function DeltaVariation({ value, percent, ...props }: Props) {
  const delta = value;

  if (Number.isNaN(delta)) {
    return null;
  }

  const absDelta = Math.abs(delta);
  const roundedDelta = parseFloat(delta.toFixed(2));

  if (roundedDelta === 0) {
    return (
      <Text variant="large" color="neutral.c60" fontWeight="semiBold">
        &minus;
      </Text>
    );
  }

  const [color, ArrowIcon, sign] =
    roundedDelta > 0.0
      ? ["success.c50", IconsLegacy.ArrowEvolutionUpMedium, "+"]
      : roundedDelta < 0.0
        ? ["error.c50", IconsLegacy.ArrowEvolutionDownMedium, "-"]
        : ["neutral.c70", null, "-"];

  return (
    <Flex flexDirection="row" alignItems="center">
      {percent && ArrowIcon ? <ArrowIcon size={20} color={color} /> : null}
      <Text variant="body" ml={2} fontWeight="semiBold" color={color} {...props}>
        {percent ? `${absDelta.toFixed(2)}%` : `${sign}${absDelta}`}
      </Text>
    </Flex>
  );
}

export default DeltaVariation;
