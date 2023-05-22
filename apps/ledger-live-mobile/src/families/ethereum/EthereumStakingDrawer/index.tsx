import React, { useCallback, useState } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

import QueuedDrawer from "../../../components/QueuedDrawer";
import { EthStakingProviders } from "./types";
import { EthereumStakingDrawerBody } from "./EthereumStakingDrawerBody";

export function EthereumStakingDrawer() {
  const [isOpen, setIsOpen] = useState(true);
  const ethStakingProviders = useFeature<EthStakingProviders>(
    "ethStakingProviders",
  );

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  if (
    !ethStakingProviders?.enabled ||
    (ethStakingProviders.params?.listProvider ?? []).length < 1
  )
    return null;

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
      <EthereumStakingDrawerBody
        providers={ethStakingProviders.params!.listProvider}
      />
    </QueuedDrawer>
  );
}
