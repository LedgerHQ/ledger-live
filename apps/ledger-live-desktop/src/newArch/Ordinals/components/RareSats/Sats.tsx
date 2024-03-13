import { Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { OrdinalsIcons } from "../Icons";
import { rgba } from "~/renderer/styles/helpers";
import { Ordinal } from "../../types/Ordinals";

type CardProps = {
  ordinal: Ordinal;
  isLast: boolean;
};

export const SatsRow = ({ ordinal, isLast }: CardProps) => {
  if (!ordinal.metadata.utxo_details) return null;

  return (
    <Row py={"10px"} px="20px" alignItems={"center"} justifyContent="space-between" isLast={isLast}>
      <Flex flexDirection={"column"} width={"90%"} mr={2}>
        {Object.entries(ordinal.metadata.utxo_details.satributes).map(([key, element], index) => (
          <SubComponent
            keySats={key}
            nbSats={element.count}
            name={element.display_name}
            year={ordinal.metadata.utxo_details?.sat_ranges[index]?.year}
            key={key}
          />
        ))}
      </Flex>

      <Flex width={"10%"} alignItems="center" justifyContent="center">
        <Text variant="small" fontWeight="medium" color="neutral.c100" fontSize={3}>
          {ordinal.metadata.utxo_details?.value || 0}
        </Text>
      </Flex>
    </Row>
  );
};

type SubProps = {
  keySats: string;
  name: string;
  nbSats: number;
  year?: number;
};
function SubComponent({ keySats, name, nbSats, year }: SubProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Flex flexDirection="row" justifyContent="space-between" alignItems="center" my={"8px"}>
      <Flex flexDirection="row" alignItems={"center"}>
        <Flex
          height={32}
          width={32}
          border={`1px solid ${colors.opacityDefault.c10}`}
          backgroundColor={colors.opacityDefault.c05}
          alignItems={"center"}
          borderRadius={"8px"}
          justifyContent={"center"}
        >
          {OrdinalsIcons[keySats as keyof typeof OrdinalsIcons] || OrdinalsIcons.common}
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
              {name}
            </Text>
            <Text variant="tiny" fontWeight="medium" fontSize={"10px"} color="neutral.c70">
              {t("account.ordinals.rareSats.list.component.total", {
                count: nbSats,
              })}
            </Text>
          </Flex>
        </Flex>
      </Flex>

      {year && (
        <Text variant="paragraph" fontWeight="medium" color="neutral.c70" fontSize={3}>
          {year}
        </Text>
      )}
    </Flex>
  );
}

const Row = styled(Flex)<{ isLast: boolean }>`
  border-bottom: ${p => (p.isLast ? undefined : `1px solid ${p.theme.colors.palette.divider}`)};
  cursor: pointer;
  &:hover {
    background: ${p => rgba(p.theme.colors.wallet, 0.04)};
  }
`;
