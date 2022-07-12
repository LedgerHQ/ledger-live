import React from "react";
import {
  BottomDrawer,
  BoxedIcon,
  Button,
  Flex,
  Text,
} from "@ledgerhq/native-ui";
import { ShieldCheckMedium } from "@ledgerhq/native-ui/assets/icons";
import Illustration from "../../images/illustration/Illustration";
import GenuineCheckDark from "../../../images/illustration/Dark/_FamilyPackX.png";
import GenuineCheckLight from "../../../images/illustration/Light/_FamilyPackX.png";

export type Props = {
  isOpen: boolean;
};

const GenuineCheckActiveDrawer = ({ isOpen }: Props) => (
  <BottomDrawer isOpen={isOpen} preventBackdropClick noCloseButton>
    <Flex height="100%" alignItems="center" justifyContent="center">
      <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={4} mt={8}>
        Allow Ledger Live to check Nano authenticity
      </Text>
      <Flex alignItems="center" justifyContent="center">
        <Illustration
          lightSource={GenuineCheckLight}
          darkSource={GenuineCheckDark}
          size={400}
        />
      </Flex>
    </Flex>
  </BottomDrawer>
);

export default GenuineCheckActiveDrawer;
