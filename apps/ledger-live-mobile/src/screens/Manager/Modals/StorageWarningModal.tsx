import React, { memo } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components/native";
import { Text, Flex, Icons, Button } from "@ledgerhq/native-ui";

import BottomModal from "../../../components/BottomModal";

type Props = {
  warning: string | null;
  onClose: () => void;
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

const StorageWarningModal = ({ warning, onClose }: Props) => (
  <BottomModal isOpened={!!warning} onClose={onClose}>
    <Flex alignItems="center">
      <IconContainer borderColor="neutral.c40">
        <Icons.StorageMedium size={24} color="error.c100" />
      </IconContainer>
      <TextContainer>
        <ModalText color="neutral.c100" fontWeight="medium" variant="h2">
          <Trans i18nKey="errors.ManagerNotEnoughSpace.title" />
        </ModalText>
        <ModalText color="neutral.c70" fontWeight="medium" variant="body">
          <Trans
            i18nKey="errors.ManagerNotEnoughSpace.info"
            values={{ app: warning }}
          />
        </ModalText>
      </TextContainer>
      <ButtonsContainer>
        <Button size="large" type="main" onPress={onClose}>
          <Trans i18nKey="errors.ManagerNotEnoughSpace.continue" />
        </Button>
      </ButtonsContainer>
    </Flex>
  </BottomModal>
);

export default memo(StorageWarningModal);
