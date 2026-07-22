import React from "react";
import { Spinner } from "@ledgerhq/lumen-ui-rnative";
import { Flex } from "@ledgerhq/native-ui";
import { createRemoteComponent } from "@shared/mobile-host-runtime";
import { ensureSwapRemote } from "~/swapRemote";

type SwapMfeProps = { name?: string };

export const SwapMfe = createRemoteComponent<SwapMfeProps>({
  loader: async () => {
    if (!(await ensureSwapRemote())) return { default: () => null };
    return import("swap/HelloWorld");
  },
  loading: (
    <Flex alignItems="center" justifyContent="center" py={6}>
      <Spinner size={24} />
    </Flex>
  ),
});
