import React, { useCallback, useState, useMemo } from "react";
import { Flex, Switch, Text } from "@ledgerhq/native-ui";
import Button from "~/components/Button";
import { useModularDrawerController } from "../hooks/useModularDrawerController";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";

function ModularDrawerScreenDebug() {
  const { openDrawer } = useModularDrawerController();

  const currencies = useMemo(() => listAndFilterCurrencies({ includeTokens: true }), []);
  const [enableLocalAccountSelection, setEnableLocalAccountSelection] = useState(true);

  const handleToggleDrawer = useCallback(() => {
    openDrawer({
      currencies,
      enableAccountSelection: enableLocalAccountSelection,
      flow: "debug_flow",
      source: "debug_screen",
    });
  }, [openDrawer, currencies, enableLocalAccountSelection]);

  return (
    <Flex flexDirection="column" rowGap={4} px={6}>
      <Flex flexDirection="row" alignItems="center" justifyContent="space-between" mb={4}>
        <Text variant="body" fontWeight="medium">
          {"Enable Account Selection"}
        </Text>
        <Switch checked={enableLocalAccountSelection} onChange={setEnableLocalAccountSelection} />
      </Flex>

      <Button
        size="small"
        type="main"
        title={`Open MAD Drawer (${enableLocalAccountSelection ? "with" : "without"} account selection)`}
        onPress={handleToggleDrawer}
      />
    </Flex>
  );
}

export default ModularDrawerScreenDebug;
