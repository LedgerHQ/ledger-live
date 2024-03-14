import { Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTheme } from "styled-components";
import { mappingKeysWithIconAndName } from "../../types/mappingKeys";
import Tooltip from "~/renderer/components/Tooltip";

type Props = {
  keySats: string[];
  withMore?: boolean;
};

export function SatributesIcons({ keySats, withMore = false }: Props) {
  const { colors } = useTheme();

  const limit = getLimit(keySats.length, withMore);

  const content = keySats
    .map(
      key =>
        mappingKeysWithIconAndName[key as keyof typeof mappingKeysWithIconAndName].name ||
        mappingKeysWithIconAndName.common.name,
    )
    .join(" - ");

  return (
    <Tooltip content={content} placement="auto">
      <Flex
        height={32}
        width={32 * (keySats.length === 1 ? 1 : limit)}
        border={`1px solid ${colors.opacityDefault.c10}`}
        backgroundColor={colors.opacityDefault.c05}
        alignItems={"center"}
        borderRadius={"8px"}
        justifyContent={keySats.length > 1 ? "space-around" : "center"}
      >
        {keySats
          .slice(0, limit)
          .map(
            key =>
              mappingKeysWithIconAndName[key as keyof typeof mappingKeysWithIconAndName].icon ||
              mappingKeysWithIconAndName.common.icon,
          )}

        {keySats.length > 2 && withMore && (
          <Flex alignItems="center" justifyContent="center" height={20} width={20}>
            <Text variant="paragraph" color="neutral.c70" fontSize={3}>
              {`+${keySats.length - 1}`}
            </Text>
          </Flex>
        )}
      </Flex>
    </Tooltip>
  );
}

const getLimit = (length: number, withMore: boolean) => {
  let limit = 0;

  switch (length) {
    case 1:
      limit = 1;
      break;
    case 2:
      limit = 2;
      break;
    default:
    case 3:
      limit = withMore ? 1 : length;
  }

  return limit;
};
