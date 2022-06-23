import React, { useCallback, useState } from "react";
import { TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import styled from "styled-components/native";
import { Flex, Text, Button, Checkbox } from "@ledgerhq/native-ui";

type Props = {
  closeModal: Function;
  setStep: Function;
  setShouldNotRemindUserAgain: Function;
};

const ConfirmUnverified = ({
  closeModal,
  setStep,
  setShouldNotRemindUserAgain,
}: Props) => {
  const [doNotRemindUserAgain, setDoNotRemindUserAgain] = useState(false);
  const toggleDoNotRemindUserAgain = useCallback(() => {
    setDoNotRemindUserAgain(!doNotRemindUserAgain);
  }, [doNotRemindUserAgain]);

  const onGoBack = useCallback(() => {
    setStep("initMessage");
  }, [setStep]);
  const onCloseModal = useCallback(() => {
    closeModal();
    if (doNotRemindUserAgain) {
      setShouldNotRemindUserAgain();
    }
  }, [closeModal, doNotRemindUserAgain, setShouldNotRemindUserAgain]);

  return (
    <Flex flex={1} justifyContent="center" mt={3}>
      <Text
        variant="h4"
        fontWeight="semiBold"
        color="neutral.c100"
        lineHeight="31.2px"
      >
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
      <TouchableOpacity
        style={{ marginVertical: 32 }}
        onPress={toggleDoNotRemindUserAgain}
      >
        <Flex
          flexDirection="row"
          alignItems="center"
          bg="neutral.c30"
          borderRadius={4}
          p={6}
        >
          <Checkbox
            checked={doNotRemindUserAgain}
            onChange={toggleDoNotRemindUserAgain}
          />
          <Text
            variant="body"
            fontWeight="medium"
            color="neutral.c100"
            lineHeight="23.8px"
            ml={4}
          >
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
          <Button onPress={onCloseModal} type="main" size="large">
            <Trans i18nKey="transfer.receive.securityDontVerify.yes" />
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ConfirmUnverified;
