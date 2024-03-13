import { Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import { OrdinalsIcons } from "../Icons";

const LIMIT = 3;
type CardProps = {
  collections: {
    name: string;
    totalStats: number;
  }[];
  year: number;
  totalStats: number;
};

export const SatsCard = ({ collections, year, totalStats }: CardProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Flex
      p={5}
      backgroundColor="opacityDefault.c05"
      borderRadius={"8px"}
      justifyContent="space-between"
      flexDirection="column"
    >
      <Flex
        height={32}
        width={32}
        border={`1px solid ${colors.opacityDefault.c10}`}
        backgroundColor={colors.opacityDefault.c05}
        alignItems={"center"}
        borderRadius={"8px"}
        justifyContent="center"
      >
        {(collections.map(c => c.name.toLowerCase()).includes("nakamoto") &&
          OrdinalsIcons["nakamoto"]) || <Flex bg="red" height={20} width={20} />}
      </Flex>

      <Flex flexDirection="column" flex={1}>
        {collections.slice(0, LIMIT).map((collection, index) => (
          <Flex flexDirection={"row"} alignItems={"center"} mt={"8px"} key={index}>
            <Text variant="body" fontWeight="semiBold" color="neutral.c100" mr={1}>
              {collection.name}
            </Text>
            <Tag
              text={t("account.ordinals.rareSats.card.total", { total: collection.totalStats })}
            />
          </Flex>
        ))}
      </Flex>

      {collections.length > LIMIT && (
        <Text variant="body" fontWeight="semiBold" color="neutral.c100" mt={"8px"}>
          {t("account.ordinals.rareSats.card.others", { others: collections.length - LIMIT })}
        </Text>
      )}

      <Flex flexDirection="column" mt={"10px"}>
        <Flex flexDirection={"row"} justifyContent="space-between" alignItems={"center"}>
          <Text variant="small" fontWeight="medium" color="neutral.c70">
            {t("account.ordinals.rareSats.card.total", { total: totalStats })}
          </Text>

          <Text variant="paragraph" fontWeight="medium" color="neutral.c70" fontSize={3}>
            {year}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};

type TagProps = {
  text: string;
};

function Tag({ text }: TagProps) {
  const colors = useTheme().colors;
  return (
    <Text
      variant="small"
      fontWeight="medium"
      color="neutral.c100"
      border={`1px solid ${colors.opacityDefault.c10}`}
      borderRadius={4}
      paddingX={"4px"}
    >
      {text}
    </Text>
  );
}
