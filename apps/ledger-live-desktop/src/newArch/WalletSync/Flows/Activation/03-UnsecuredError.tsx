import { Box, Flex, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import styled, { useTheme } from "styled-components";
import { setFlow, setStep } from "~/renderer/actions/walletSync";
import ButtonV3 from "~/renderer/components/ButtonV3";
import { Flow, Step } from "~/renderer/reducers/walletSync";

const Container = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 100%;
  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const UnsecuredError = () => {
  const dispatch = useDispatch();
  const tryAgain = () => console.log("try again");
  const goToDelete = () => {
    dispatch(setFlow(Flow.ManageBackups));
    dispatch(setStep(Step.ManageBackupStep));
  };
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      rowGap="24px"
      paddingX={50}
    >
      <Container>
        <Icons.DeleteCircleFill size={"L"} color={colors.error.c60} />
      </Container>
      <Text fontSize={24} variant="h4Inter" color="neutral.c100" textAlign="center">
        {t("walletSync.unsecuredError.title")}
      </Text>

      <Flex flexDirection="column" rowGap="16px">
        <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center" fontSize={14}>
          {t("walletSync.unsecuredError.description")}
        </Text>
        <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center" fontSize={14}>
          {t("walletSync.unsecuredError.info")}
        </Text>
      </Flex>

      <ButtonV3 variant="shade" onClick={tryAgain}>
        {t("walletSync.unsecuredError.cta")}
      </ButtonV3>
      <ButtonV3 onClick={goToDelete}>{t("walletSync.unsecuredError.ctaDelete")}</ButtonV3>
    </Flex>
  );
};
