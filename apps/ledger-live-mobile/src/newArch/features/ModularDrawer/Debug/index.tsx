import React, { useState } from "react";
import { Flex } from "@ledgerhq/native-ui";
import Button from "~/components/Button";
import { ModularDrawer } from "../ModularDrawer";
import { ModularDrawerStep } from "../types";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";

function ModularDrawerScreenDebug() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleToggleDrawer = () => setIsDrawerOpen(open => !open);
  const handleDrawerClose = () => setIsDrawerOpen(false);

  const currencies = listAndFilterCurrencies({ includeTokens: true });

  const assetsConfiguration = {
    filter: "topNetworks",
    leftElement: "apy",
    rightElement: "balance",
  } as const;

  const networksConfiguration = {
    leftElement: "numberOfAccounts",
    rightElement: "balance",
  } as const;

  return (
    <Flex flexDirection="column" rowGap={4} px={6}>
      <Button size="small" type="main" title="Open MAD Drawer" onPress={handleToggleDrawer} />

      <ModularDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        selectedStep={ModularDrawerStep.Asset}
        currencies={currencies}
        flow="debug_flow"
        source="debug_screen"
        assetsConfiguration={assetsConfiguration}
        networksConfiguration={networksConfiguration}
      />
    </Flex>
  );
}

export default ModularDrawerScreenDebug;
