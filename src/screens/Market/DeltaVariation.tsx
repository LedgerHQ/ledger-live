import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import React, { memo } from "react";

type Props = {
  value: number;
  percent?: boolean;
};

function DeltaVariation({ value, percent }: Props) {
  const delta = percent && value ? value * 100 : value;

  if (Number.isNaN(delta)) {
    return null;
  }

  const absDelta = Math.abs(delta);

  const [color, ArrowIcon, sign] =
    delta !== 0
      ? delta > 0
        ? ["success.c100", Icons.ArrowUpMedium, "+"]
        : ["error.c100", Icons.ArrowDownMedium, "-"]
      : ["neutral.c100", null, ""];

  return (
    <Flex flexDirection="row" alignItems="center">
      {percent && ArrowIcon ? <ArrowIcon size={10} color={color} /> : null}
      <Text variant="body" ml={2} fontWeight="semiBold" color={color}>
        {percent ? `${absDelta.toFixed(0)}%` : `${sign}${absDelta}`}
      </Text>
    </Flex>
  );
}

export default memo(DeltaVariation);
