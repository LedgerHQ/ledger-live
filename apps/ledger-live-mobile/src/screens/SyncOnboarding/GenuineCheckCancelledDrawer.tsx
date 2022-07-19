import React from "react";
import {
  BottomDrawer,
  BoxedIcon,
  Button,
  Flex,
  Text,
} from "@ledgerhq/native-ui";
import { ShieldCheckMedium } from "@ledgerhq/native-ui/assets/icons";

export type Props = {
  isOpen: boolean;
  onRetry?: () => void;
  onSkip?: () => void;
};

const GenuineCheckCancelledDrawer = ({ isOpen, onRetry, onSkip }: Props) => (
  <BottomDrawer isOpen={isOpen} preventBackdropClick noCloseButton>
    <Flex justifyContent="center" alignItems="center" flex={1} mt={9} mb={6}>
      <BoxedIcon
        Icon={<ShieldCheckMedium color="warning.c100" size={24} />}
        variant="circle"
        backgroundColor="warning.c30"
        borderColor="transparent"
        size={48}
      />
    </Flex>
    <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={4} mt={8}>
      Authenticity check was cancelled on your Nano
    </Text>
    <Text
      textAlign="center"
      variant="bodyLineHeight"
      mb={8}
      color="neutral.c80"
    >
      {`We highly recommend performing this check to verify your Stax has not been tampered with.`}
    </Text>
    <Button type="main" mb={4} onPress={onRetry}>
      Run check again
    </Button>
    <Button onPress={onSkip}>Skip for now</Button>
  </BottomDrawer>
);

export default GenuineCheckCancelledDrawer;
