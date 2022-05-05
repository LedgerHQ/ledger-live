import React, { memo } from "react";
import { TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import styled from "styled-components/native";
import { Flex, Icons, Text, Button } from "@ledgerhq/native-ui";

import BottomModal from "../../../components/BottomModal";

type Props = {
  isOpened: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const IconContainer = styled(Flex).attrs({
  marginVertical: 20,
  padding: 22,
  borderWidth: 1,
  borderRadius: 8,
})``;

const TextContainer = styled(Flex).attrs({
  marginTop: 4,
  marginBottom: 32,
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
})``;

const ModalText = styled(Text).attrs({
  textAlign: "center",
  marginTop: 16,
})``;

const ButtonsContainer = styled(Flex).attrs({
  marginTop: 24,
  width: "100%",
})``;

const CancelButton = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
  margin-top: 25;
`;

const UninstallAllModal = ({ isOpened, onClose, onConfirm }: Props) => (
  <BottomModal isOpened={!!isOpened} onClose={onClose}>
    <Flex alignItems="center">
      <IconContainer borderColor="neutral.c40">
        <Icons.TrashMedium size={24} color="error.c100" />
      </IconContainer>
      <TextContainer>
        <ModalText color="neutral.c100" fontWeight="medium" variant="h2">
          <Trans i18nKey="manager.uninstall.subtitle" />
        </ModalText>
        <ModalText color="neutral.c70" fontWeight="medium" variant="body">
          <Trans i18nKey="manager.uninstall.description" />
        </ModalText>
      </TextContainer>
      <ButtonsContainer>
        <Button size="large" type="error" onPress={onConfirm}>
          <Trans i18nKey="manager.uninstall.uninstallAll" />
        </Button>
        <CancelButton onPress={onClose}>
          <Text variant="large" fontWeight="semiBold" color="neutral.c100">
            <Trans i18nKey="common.cancel" />
          </Text>
        </CancelButton>
      </ButtonsContainer>
    </Flex>
  </BottomModal>
);

export default memo(UninstallAllModal);
