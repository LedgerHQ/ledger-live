import { Box, Link, Text } from "@ledgerhq/native-ui";
import React from "react";
import { Trans } from "react-i18next";
import { Linking } from "react-native";
import { urls } from "../../config/urls";

export const notAvailableModalInfo = [
  {
    title: <Trans i18nKey={"nft.modalDisabled.title"} />,
    description: (
      <>
        <Box mb={3}>
          <Text fontWeight="medium" mb={2}>
            <Trans i18nKey={"nft.modalDisabled.body"} />
          </Text>
        </Box>
        <Link
          type="color"
          size="medium"
          onPress={() => Linking.openURL(urls.nft.supportDisableIos)}
        >
          <Trans i18nKey={"nft.modalDisabled.contactSupport"} />
        </Link>
      </>
    ),
  },
];
