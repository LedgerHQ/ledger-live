import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import React, { memo } from "react";

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

  const [color, ArrowIcon, sign] =
    delta !== 0
      ? delta > 0
        ? ["success.c50", Icons.ArrowEvolutionUpMedium, "+"]
        : ["error.c50", Icons.ArrowEvolutionDownMedium, "-"]
      : ["neutral.c100", null, ""];

  return (
    <Flex flexDirection="row" alignItems="center">
      {percent && ArrowIcon ? <ArrowIcon size={20} color={color} /> : null}
      <Text variant="body" ml={2} fontWeight="semiBold" color={color} {...props}>
        {percent ? `${absDelta.toFixed(2)}%` : `${sign}${absDelta}`}
      </Text>
    </Flex>
  );
}

export default memo(DeltaVariation);
