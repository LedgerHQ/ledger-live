import React, { useCallback } from "react";
import { BottomDrawer, Button, Link, Text } from "@ledgerhq/native-ui";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";

export type Props = {
  isOpen: boolean;
  onClose?: () => void;
};

const HelpDrawer = ({ isOpen, onClose }: Props) => {
  const handleDocumentationPress = useCallback(() => {
    // TODO: add logic when user press "FAQ" button
  }, []);

  const handleSupportPress = useCallback(() => {
    // TODO: add logic when user press "Support" button
  }, []);

  return (
    <BottomDrawer onClose={onClose} isOpen={isOpen}>
      <Text variant="h4" textAlign="center" mb={4}>
        Need some help with your setup manual?
      </Text>
      <Text variant="body" textAlign="center" mb={4} color="neutral.c80">
        Lorem Elsass ipsum aliquam bissame Oberschaeffolsheim gehts messti de
        Bischheim tellus blottkopf, dui sed libero. hopla libero, placerat leo
        eget Gal.
      </Text>
      <Text variant="body" textAlign="center" mb={8} color="neutral.c80">
        Lorem Elsass ipsum aliquam bissame Oberschaeffolsheim gehts messti de
        Bischheim tellus blottkopf, dui sed libero. hopla libero, placerat leo
        eget Gal.
      </Text>
      <Button type="main" mb={6} onPress={handleDocumentationPress}>
        View our FAQs
      </Button>
      <Link Icon={ExternalLinkMedium} onPress={handleSupportPress}>
        Speak to a human
      </Link>
    </BottomDrawer>
  );
};

export default HelpDrawer;
