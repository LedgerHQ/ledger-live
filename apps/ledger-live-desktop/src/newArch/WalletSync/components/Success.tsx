import { Box, Flex, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import ButtonV3 from "~/renderer/components/ButtonV3";

type Props = {
  title?: string;
  description?: string;
  withCta?: boolean;
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

export const Success = ({ title, description, withCta = false }: Props) => {
  const onClick = () => console.log("click");
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" rowGap="24px">
      <Container>
        <Icons.CheckmarkCircleFill size={"L"} color={colors.success.c60} />
      </Container>
      <Text fontSize={24} variant="h4Inter" color="neutral.c100" textAlign="center">
        {title}
      </Text>
      <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
        {description}
      </Text>

      {withCta && (
        <BottomContainer mb={3} width={"100%"} px={"40px"}>
          <ButtonV3 variant="main" onClick={onClick} flex={1}>
            {t("walletSync.success.backup.synchAnother")}
          </ButtonV3>
        </BottomContainer>
      )}
    </Flex>
  );
};

const BottomContainer = styled(Flex)`
  position: absolute;
  bottom: 0;
`;
