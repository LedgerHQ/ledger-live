import React from "react";
import { Spinner } from "@ledgerhq/lumen-ui-rnative";
import { Flex } from "@ledgerhq/native-ui";
import { createRemoteComponent } from "@shared/mobile-host-runtime";
import { ensureSwapRemote } from "~/swapRemote";

const RemoteSwapScreen = createRemoteComponent({
  loader: async () => {
    if (!(await ensureSwapRemote())) return { default: () => null };
    return import("swap/SwapNavigator");
  },
  loading: (
    <Flex flex={1} alignItems="center" justifyContent="center">
      <Spinner size={24} />
    </Flex>
  ),
});

export function SwapMfeScreen() {
  return (
    <Flex flex={1}>
      <RemoteSwapScreen />
    </Flex>
  );
}
