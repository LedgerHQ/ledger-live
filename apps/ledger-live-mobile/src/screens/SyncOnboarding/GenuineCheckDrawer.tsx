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
  onPress?: () => void;
};

const GenuineCheckDrawer = ({ isOpen, onPress }: Props) => (
  <BottomDrawer
    onClose={onPress}
    isOpen={isOpen}
    preventBackdropClick
    noCloseButton
  >
    <Flex justifyContent="center" alignItems="center" flex={1} mt={9} mb={6}>
      <BoxedIcon
        Icon={<ShieldCheckMedium color="primary.c90" size={24} />}
        variant="circle"
        backgroundColor="primary.c30"
        borderColor="transparent"
        size={48}
      />
    </Flex>
    <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={4} mt={8}>
      Verify that your Nano is authentic and safe to use
    </Text>
    <Text
      textAlign="center"
      variant="bodyLineHeight"
      mb={8}
      color="neutral.c80"
    >
      {`We will perform a check to ensure your device hasn't been tampered with. You'll need to accept this on your Nano.`}
    </Text>
    <Button type="main" mb={6} onPress={onPress}>
      Check authenticity
    </Button>
  </BottomDrawer>
);

export default GenuineCheckDrawer;
