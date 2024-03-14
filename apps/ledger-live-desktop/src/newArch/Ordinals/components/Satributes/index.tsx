import { Flex } from "@ledgerhq/react-ui";
import React from "react";
import { useTheme } from "styled-components";
import { mappingKeysWithIconAndName } from "../../types/mappingKeys";

type Props = {
  keySats: string[];
};

export function SatributesIcons({ keySats }: Props) {
  const { colors } = useTheme();
  return (
    <Flex
      height={32}
      width={32 * keySats.length}
      border={`1px solid ${colors.opacityDefault.c10}`}
      backgroundColor={colors.opacityDefault.c05}
      alignItems={"center"}
      borderRadius={"8px"}
      justifyContent={keySats.length > 1 ? "space-around" : "center"}
    >
      {keySats.map(
        key =>
          mappingKeysWithIconAndName[key as keyof typeof mappingKeysWithIconAndName].icon ||
          mappingKeysWithIconAndName.common.icon,
      )}
    </Flex>
  );
}
