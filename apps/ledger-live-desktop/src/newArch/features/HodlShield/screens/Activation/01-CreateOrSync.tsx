import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTheme } from "styled-components";
import ButtonV3 from "~/renderer/components/ButtonV3";
import { LogoWrapper } from "../../components/LogoWrapper";
import Input from "~/renderer/components/Input";
import { setHodlShieldEmail, setHodlShieldPhone } from "~/renderer/actions/settings";
import { useDispatch, useSelector } from "react-redux";
import { hodlShieldEmailSelector, hodlShieldPhoneSelector } from "~/renderer/reducers/settings";

type Props = {
  goToCreateBackup: () => void;
  goToSync: () => void;
};

export default function CreateOrSynchronizeStep({ goToCreateBackup }: Props) {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const currentEmail = useSelector(hodlShieldEmailSelector);
  const currentPhone = useSelector(hodlShieldPhoneSelector);

  function handleEmailChange(value: string) {
    dispatch(setHodlShieldEmail(value));
  }
  function handlePhoneChange(value: string) {
    dispatch(setHodlShieldPhone(value));
  }

  return (
    <Flex flexDirection="column" alignSelf="center" justifyContent="center" rowGap="24px">
      <Flex justifyContent="center" alignItems="center">
        <LogoWrapper>
          <Icons.Mobile color={colors.constant.purple} />
        </LogoWrapper>

        <LogoWrapper opacity="100%">
          <Icons.Refresh size="L" color={colors.constant.purple} />
        </LogoWrapper>

        <LogoWrapper>
          <Icons.Desktop color={colors.constant.purple} />
        </LogoWrapper>
      </Flex>

      <Text fontSize={24} variant="h4Inter" textAlign="center">
        Activate Hodl Shield?
      </Text>
      <Text fontSize={14} variant="body" color="hsla(0, 0%, 58%, 1)" textAlign="center">
        To enhance your security, please provide the email address/phone number of a trusted
        contact. This individual will be immediately notified if your Hodl Shield PIN code is ever
        used, ensuring you&apos;re alerted promptly in case of any potential danger. Rest assured,
        this information will be securely encrypted.
      </Text>
      <Flex width="100%" flexDirection="column" rowGap="16px">
        <Input
          name="hodlshield_email"
          placeholder="Trusted email address..."
          value={currentEmail}
          onChange={handleEmailChange}
        />
      </Flex>
      <Flex width="100%" flexDirection="column" rowGap="16px">
        <Input
          name="hodlshield_telephone"
          placeholder="Trusted phone number..."
          value={currentPhone}
          onChange={handlePhoneChange}
        />
      </Flex>
      <Flex justifyContent="center" width="100%">
        <ButtonV3 variant="main" width="100%" onClick={goToCreateBackup}>
          <Text variant="body" color="neutral.c00" fontSize={14} flexShrink={1}>
            Turn on Hodl Shield
          </Text>
        </ButtonV3>
      </Flex>
    </Flex>
  );
}
