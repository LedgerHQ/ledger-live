import React, { useState } from "react";
import { Flex } from "@ledgerhq/native-ui";
import Button from "~/components/Button";
import { ModularDrawer } from "../ModularDrawer";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";

function ModularDrawerScreenDebug() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleToggleDrawer = () => setIsDrawerOpen(open => !open);
  const handleDrawerClose = () => setIsDrawerOpen(false);

  const currencies = listAndFilterCurrencies({ includeTokens: true });

  return (
    <Flex flexDirection="column" rowGap={4} px={6}>
      <Button size="small" type="main" title="Open MAD Drawer" onPress={handleToggleDrawer} />

      <ModularDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} currencies={currencies} />
    </Flex>
  );
}

export default ModularDrawerScreenDebug;
