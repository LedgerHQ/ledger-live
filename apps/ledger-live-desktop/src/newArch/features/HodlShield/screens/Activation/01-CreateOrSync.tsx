import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTheme } from "styled-components";
import ButtonV3 from "~/renderer/components/ButtonV3";
import { LogoWrapper } from "../../components/LogoWrapper";

type Props = {
  goToCreateBackup: () => void;
  goToSync: () => void;
};

export default function CreateOrSynchronizeStep({ goToCreateBackup }: Props) {
  const { colors } = useTheme();

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
        Adds a contact email from a confident person that will be notified if you use Hodl Shield
        pin code. For example, he will be able to help you by contacting your local authorities.
      </Text>
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
