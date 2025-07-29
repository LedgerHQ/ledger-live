import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import Button from "~/components/Button";
import { ModularDrawer } from "../ModularDrawer";
import { useModularDrawerStore } from "../hooks/useModularDrawerStore";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";

function ModularDrawerScreenDebug() {
  const { openDrawer, isOpen, closeDrawer, preselectedCurrencies } = useModularDrawerStore();
  const currencies = listAndFilterCurrencies({ includeTokens: true });
  const handleToggleDrawer = () => {
    openDrawer({ currencies, enableAccountSelection: true });
  };

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
    <Flex flexDirection="column" rowGap={4} px={6} flex={1}>
      <Button size="small" type="main" title="Open MAD Drawer" onPress={handleToggleDrawer} />

      <ModularDrawer
        isOpen={isOpen}
        onClose={closeDrawer}
        currencies={preselectedCurrencies}
        flow="debug_flow"
        source="debug_screen"
        assetsConfiguration={assetsConfiguration}
        networksConfiguration={networksConfiguration}
      />
    </Flex>
  );
}

export default ModularDrawerScreenDebug;
