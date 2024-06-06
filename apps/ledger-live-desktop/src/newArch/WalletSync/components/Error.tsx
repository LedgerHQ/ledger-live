import { Box, Flex, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import ButtonV3 from "~/renderer/components/ButtonV3";

type Props = {
  title?: string;
  description?: string;
};

const Container = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 100%;
  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Error = ({ title, description }: Props) => {
  const tryAgain = () => console.log("try again");
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" rowGap="24px">
      <Container>
        <Icons.DeleteCircleFill size={"L"} color={colors.error.c60} />
      </Container>
      <Text fontSize={24} variant="h4Inter" color="neutral.c100">
        {title}
      </Text>
      <Text variant="bodyLineHeight" color="neutral.c70">
        {description}
      </Text>

      <ButtonV3 variant="shade" onClick={tryAgain}>
        {t("walletSync.error.cta")}
      </ButtonV3>
    </Flex>
  );
};
