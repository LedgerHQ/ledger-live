import { Flex } from "@ledgerhq/react-ui/index";
import React from "react";
import { MetadataProvider } from "~/renderer/screens/settings/sections/Developer/NftsTools/screens/NMS/MetadataProvider";
import { SupportedChains } from "~/renderer/screens/settings/sections/Developer/NftsTools/screens/SupportedChains";
import { useSupportedChainsViewModel } from "~/renderer/screens/settings/sections/Developer/NftsTools/screens/SupportedChains/useSupportedChainsViewModel";

export function ConfigTab() {
  return (
    <Flex flexDirection="column" rowGap={2}>
      <SupportedChains {...useSupportedChainsViewModel()} />
      <MetadataProvider />
    </Flex>
  );
}
