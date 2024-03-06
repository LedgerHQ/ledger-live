import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { useTheme } from "styled-components";
import { Title } from "~/renderer/components/DeviceAction/rendering";
import { EntryPoint } from "../types/AnalyticsOptInromptNavigator";
import Box from "~/renderer/components/Box";
import styled from "styled-components";

const DrawerBox = styled(Box)`
  margin-left: 40px;
`;

const DrawerTitle = styled(Title)`
  text-align: left;
`;

interface AnalyticsOptInPromptProps {
  onClose?: () => void;
  onSubmit?: () => void;
  isOpened?: boolean;
  entryPoint?: EntryPoint;
  variant?: ABTestingVariants;
}

const AnalyticsOptInPrompt: React.FC<AnalyticsOptInPromptProps> = ({
  onClose,
  onSubmit,
  isOpened,
  entryPoint,
  variant,
}) => {
  const { colors } = useTheme();

  const isPortfolio = useLocation().pathname.toLocaleLowerCase() === "/";
  const [preventClosable, setPreventClosable] = useState(false);
  const [preventBackNavigation, setPreventBackNavigation] = useState(false);

  let isVariantA = true;
  try {
    isVariantA = variant !== ABTestingVariants.variantB;
  } catch (error) {
    console.error("An error occurred: ", error);
  }

  useEffect(() => {
    if (isPortfolio) setPreventClosable(true);
    if (isPortfolio) setPreventBackNavigation(false);
  }, [isPortfolio, entryPoint, onSubmit]);

  return (
    <div>
      <SideDrawer
        withPaddingTop
        isOpen={isOpened}
        direction={"left"}
        onRequestBack={preventBackNavigation ? undefined : onSubmit}
        onRequestClose={preventClosable ? undefined : onClose}
        style={{
          background: colors.background.main,
          paddingTop: "40px",
        }}
      >
        <DrawerBox>
          <DrawerTitle>Manage your preferences</DrawerTitle>
          {isVariantA ? "variant A" : "variant B"}
        </DrawerBox>
      </SideDrawer>
    </div>
  );
};
export default AnalyticsOptInPrompt;
