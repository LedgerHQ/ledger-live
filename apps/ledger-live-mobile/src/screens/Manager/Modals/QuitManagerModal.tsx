import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import styled from "styled-components/native";
import { Flex, IconsLegacy, Text, Button } from "@ledgerhq/native-ui";
import QueuedDrawer from "~/components/QueuedDrawer";

type Props = {
  isOpened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  installQueue: string[];
  uninstallQueue: string[];
};

const IconContainer = styled(Flex).attrs({
  marginTop: 20,
  padding: 22,
  borderWidth: 1,
  borderRadius: 8,
})``;

const TextContainer = styled(Flex).attrs({
  marginTop: "24px",
  marginBottom: "32px",
  flexDirection: "column",
  alignItems: "center",
  alignSelf: "stretch",
  justifyContent: "center",
})``;

const ModalText = styled(Text).attrs({
  textAlign: "center",
})``;

const ButtonsContainer = styled(Flex).attrs({
  width: "100%",
})``;

const CancelButton = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
  margin-top: 25;
`;

const QuitManagerModal = ({
  isOpened,
  onConfirm,
  onClose,
  installQueue,
  uninstallQueue,
}: Props) => {
  const actionRunning = useMemo(
    () =>
      installQueue.length > 0 ? (uninstallQueue.length > 0 ? "update" : "install") : "uninstall",
    [uninstallQueue.length, installQueue.length],
  );

  return (
    <QueuedDrawer isRequestingToBeOpened={!!isOpened} onClose={onClose} noCloseButton>
      <Flex alignItems="center">
        <IconContainer borderColor="neutral.c40">
          <IconsLegacy.QuitMedium size={24} color="neutral.c100" />
        </IconContainer>
        <TextContainer>
          <ModalText color="neutral.c100" fontWeight="medium" variant="h2">
            <Trans i18nKey={`errors.ManagerQuitPage.${actionRunning}.title`} />
          </ModalText>
          <ModalText marginTop="16px" color="neutral.c70" fontWeight="medium" variant="body">
            <Trans i18nKey={`errors.ManagerQuitPage.${actionRunning}.description`} />
          </ModalText>
        </TextContainer>
        <ButtonsContainer>
          <Button size="large" type="main" onPress={onClose}>
            <Trans i18nKey="common.continue" />
          </Button>
          <CancelButton onPress={onConfirm}>
            <Text variant="large" fontWeight="semiBold" color="neutral.c100">
              <Trans i18nKey="errors.ManagerQuitPage.quit" />
            </Text>
          </CancelButton>
        </ButtonsContainer>
      </Flex>
    </QueuedDrawer>
  );
};

export default QuitManagerModal;
