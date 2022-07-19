import React from "react";
import {
  BottomDrawer,
  BoxedIcon,
  Button,
  Flex,
  Text,
} from "@ledgerhq/native-ui";
import { NanoFirmwareUpdateMedium } from "@ledgerhq/native-ui/assets/icons";

export type Props = {
  isOpen: boolean;
  onSkip?: () => void;
  onUpdate?: () => void;
};

const FirmwareUpdateDrawer = ({ isOpen, onSkip, onUpdate }: Props) => (
  <BottomDrawer onClose={onSkip} isOpen={isOpen} preventBackdropClick>
    <Flex justifyContent="center" alignItems="center">
      <BoxedIcon
        Icon={<NanoFirmwareUpdateMedium color="primary.c90" size={24} />}
        variant="circle"
        backgroundColor="primary.c30"
        borderColor="transparent"
        size={48}
      />
    </Flex>
    <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={4} mt={8}>
      New software found
    </Text>
    <Text
      textAlign="center"
      variant="bodyLineHeight"
      mb={8}
      color="neutral.c80"
    >
      {`To access the latest security features, we highly recommend updating your Nano.`}
    </Text>
    <Button type="main" mb={6} onPress={onUpdate}>
      Update
    </Button>
  </BottomDrawer>
);

export default FirmwareUpdateDrawer;
