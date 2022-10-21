import React, { useState } from "react";
import { Button, Drawer } from "@ledgerhq/react-ui";
import { FeatureFlagContent } from ".";

const FeatureFlagDrawerButton = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      <Drawer big isOpen={isOpen} onClose={() => setIsOpen(false)} direction="left">
        <FeatureFlagContent visible />
      </Drawer>
      <Button variant="main" outline mb="24px" onClick={() => setIsOpen(true)}>
        {"Open Feature Flags Settings"}
      </Button>
    </>
  );
};

export default FeatureFlagDrawerButton;
