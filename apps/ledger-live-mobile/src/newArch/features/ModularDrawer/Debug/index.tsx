import React, { useCallback, useState } from "react";
import { Flex } from "@ledgerhq/native-ui";
import Button from "~/components/Button";
import QueuedDrawer from "~/components/QueuedDrawer";

function ModularDrawerScreenDebug() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleToggleDrawer = useCallback(() => {
    setIsDrawerOpen(open => !open);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  return (
    <Flex flexDirection="column" rowGap={4} px={6}>
      <Button size="small" type="main" title="Open MAD Drawer" onPress={handleToggleDrawer} />
      <QueuedDrawer
        isRequestingToBeOpened={isDrawerOpen}
        onClose={handleDrawerClose}
        title="MAD DEBUG"
      />
    </Flex>
  );
}

export default ModularDrawerScreenDebug;
