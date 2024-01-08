import { Box, IconsLegacy, Text } from "@ledgerhq/native-ui";
import React from "react";
import { Trans } from "react-i18next";
import { Linking } from "react-native";
import styled from "styled-components/native";
import Button from "~/components/wrappedUi/Button";

import { urls } from "~/utils/urls";
import { ModalInfo } from "~/modals/Info";

const IconInfoContainer = styled.TouchableOpacity`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 100px;
  padding: ${p => p.theme.space[6]}px;
`;

export const notAvailableModalInfo = (onClose?: () => void): ModalInfo[] => {
  return [
    {
      title: <Trans i18nKey={"nft.modalDisabled.title"} />,
      Icon: () => (
        <IconInfoContainer>
          {IconsLegacy.InfoAltFillMedium({ color: "#BBB0FF", size: 23 })}
        </IconInfoContainer>
      ),
      titleProps: { textAlign: "center", paddingLeft: 40, paddingRight: 40 },
      description: (
        <Text fontWeight="medium" color="grey" textAlign="center">
          <Trans i18nKey={"nft.modalDisabled.body"} />
        </Text>
      ),
      footer: (
        <Box mb={1} width="100%" display="flex">
          <Button type="main" mt={32} onPress={onClose}>
            <Trans i18nKey="nft.modalDisabled.continue" />
          </Button>
          <Button
            type="default"
            mt={2}
            iconPosition="right"
            Icon={IconsLegacy.ExternalLinkMedium}
            onPress={() => Linking.openURL(urls.nft.supportDisableIos)}
          >
            <Trans i18nKey={"nft.modalDisabled.learnMore"} />
          </Button>
        </Box>
      ),
    },
  ];
};
