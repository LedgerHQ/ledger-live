import { Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { OrdinalsIcons } from "../Icons";
import { rgba } from "~/renderer/styles/helpers";

type CardProps = {
  collections: {
    names: string[];
    nbSats: number;
    year: number;
  }[];
  utxo: number;
};

export const SatsRow = ({ collections, utxo }: CardProps) => {
  return (
    <Row py={"10px"} px="20px" alignItems={"center"} justifyContent="space-between">
      <Flex flexDirection={"column"} width={"90%"} mr={2}>
        {collections.map((c, index) => (
          <SubComponent key={index} {...c} />
        ))}
      </Flex>

      <Flex width={"10%"} alignItems="center" justifyContent="center">
        <Text variant="small" fontWeight="medium" color="neutral.c100" fontSize={3}>
          {utxo}
        </Text>
      </Flex>
    </Row>
  );
};

type SubProps = {
  names: string[];
  nbSats: number;
  year: number;
};
function SubComponent({ names, nbSats, year }: SubProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Flex flexDirection="row" justifyContent="space-between" alignItems="center" mt={"8px"}>
      <Flex flexDirection="row" alignItems={"center"}>
        <Flex
          height={32}
          width={32 * names.length}
          border={`1px solid ${colors.opacityDefault.c10}`}
          backgroundColor={colors.opacityDefault.c05}
          alignItems={"center"}
          borderRadius={"8px"}
          justifyContent={"center"}
        >
          {names.map(
            name =>
              OrdinalsIcons[name.toLowerCase() as keyof typeof OrdinalsIcons] ||
              OrdinalsIcons.common,
          )}
        </Flex>

        <Flex flexDirection="column" ml={2}>
          <Flex flexDirection="column">
            <Text
              variant="body"
              fontWeight="semiBold"
              color="neutral.c100"
              mr={1}
              fontSize={"12px"}
            >
              {names.join(" - ")}
            </Text>
            <Text variant="tiny" fontWeight="medium" fontSize={"10px"}>
              {t("account.ordinals.rareSats.list.component.total", {
                count: nbSats,
              })}
            </Text>
          </Flex>
        </Flex>
      </Flex>

      <Text variant="paragraph" fontWeight="medium" color="neutral.c70" fontSize={3}>
        {year}
      </Text>
    </Flex>
  );
}

const Row = styled(Flex)`
  border-bottom: 1px solid ${p => p.theme.colors.palette.divider};
  cursor: pointer;
  &:hover {
    background: ${p => rgba(p.theme.colors.wallet, 0.04)};
  }
`;
