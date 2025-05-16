import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { track } from "~/analytics";
import { Linking } from "react-native";
import { urls } from "~/utils/urls";

type Props = {
  onClose: () => void;
  userAddress: string;
};

const Message = ({ userAddress, onClose }: Props) => {
  const { t } = useTranslation();
  const goBackToAccount = useCallback(() => {
    track("button_clicked", {
      button: "Verify my address",
      drawer: "Verification Security Disclaimer",
    });
    onClose();
  }, [onClose]);
  return (
    <Flex flex={1} justifyContent="center" mt={3}>
      <Text variant="h4" fontWeight="semiBold" color="neutral.c100" lineHeight="31.2px">
        <Trans i18nKey="transfer.receive.sanctionedAddress.title" />
      </Text>
      <Text
        variant="bodyLineHeight"
        fontWeight="medium"
        color="neutral.c70"
        my={3}
        lineHeight="23.8px"
      >
        <Trans
          i18nKey="transfer.receive.sanctionedAddress.description"
          values={{
            sanctionedAddress: userAddress,
            learnMore: t("transfer.receive.sanctionedAddress.learnMore"),
          }}
          components={{
            Link: (
              <Text
                style={{ textDecorationLine: "underline" }}
                onPress={() => Linking.openURL(urls.errors["UserAddressSanctionedError"])}
              ></Text>
            ),
          }}
        />
      </Text>
      <Flex alignSelf="stretch" my={8}>
        <Button
          onPress={goBackToAccount}
          type="main"
          size="large"
          testID="button-verify-my-address"
        >
          <Trans i18nKey="transfer.receive.sanctionedAddress.close" />
        </Button>
      </Flex>
    </Flex>
  );
};

export default Message;
