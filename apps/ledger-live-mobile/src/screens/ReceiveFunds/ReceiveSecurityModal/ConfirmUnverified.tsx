import React, { useCallback, useState } from "react";
import { TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import { Flex, Text, Button, Checkbox } from "@ledgerhq/native-ui";
import { track, TrackScreen } from "~/analytics";

type Props = {
  closeModal: () => void;
  setStep: (arg: string) => void;
  setShouldNotRemindUserAgain: () => void;
};

const ConfirmUnverified = ({ closeModal, setStep, setShouldNotRemindUserAgain }: Props) => {
  const [doNotRemindUserAgain, setDoNotRemindUserAgain] = useState(false);
  const toggleDoNotRemindUserAgain = useCallback(() => {
    track("button_clicked", {
      button: "Do not remind me",
      drawer: "confirmUnverified",
    });
    setDoNotRemindUserAgain(!doNotRemindUserAgain);
  }, [doNotRemindUserAgain]);

  const onGoBack = useCallback(() => {
    setStep("initMessage");
    track("button_clicked", {
      button: "No",
      drawer: "confirmUnverified",
    });
  }, [setStep]);
  const onCloseModal = useCallback(() => {
    track("button_clicked", {
      button: "Yes",
      drawer: "confirmUnverified",
    });
    closeModal();
    if (doNotRemindUserAgain) {
      setShouldNotRemindUserAgain();
    }
  }, [closeModal, doNotRemindUserAgain, setShouldNotRemindUserAgain]);

  return (
    <Flex flex={1} justifyContent="center" mt={3}>
      <TrackScreen category="ReceiveFunds" name="No Verification Confirmation" type="drawer" />
      <Text variant="h4" fontWeight="semiBold" color="neutral.c100" lineHeight="31.2px">
        <Trans i18nKey="transfer.receive.securityDontVerify.title" />
      </Text>
      <Text
        variant="bodyLineHeight"
        fontWeight="medium"
        color="neutral.c70"
        mt={6}
        lineHeight="23.8px"
      >
        <Trans i18nKey="transfer.receive.securityDontVerify.subtitle" />
      </Text>
      <TouchableOpacity style={{ marginVertical: 32 }} onPress={toggleDoNotRemindUserAgain}>
        <Flex flexDirection="row" alignItems="center" bg="neutral.c30" borderRadius={4} p={6}>
          <Checkbox checked={doNotRemindUserAgain} onChange={toggleDoNotRemindUserAgain} />
          <Text variant="body" fontWeight="medium" color="neutral.c100" lineHeight="23.8px" ml={4}>
            <Trans i18nKey="transfer.receive.securityDontVerify.doNotRemindAgain" />
          </Text>
        </Flex>
      </TouchableOpacity>
      <Flex flexDirection="row" mb={8}>
        <Flex flex={1}>
          <Button onPress={onGoBack} outline type="main" size="large">
            <Trans i18nKey="transfer.receive.securityDontVerify.no" />
          </Button>
        </Flex>
        <Flex flex={1} ml={3}>
          <Button
            onPress={onCloseModal}
            type="main"
            size="large"
            testID="button-confirm-dont-verify"
          >
            <Trans i18nKey="transfer.receive.securityDontVerify.yes" />
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ConfirmUnverified;
