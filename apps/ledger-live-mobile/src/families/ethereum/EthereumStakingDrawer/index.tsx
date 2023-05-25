import React, { useCallback, useState } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Button, Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useRoute } from "@react-navigation/native";

import QueuedDrawer from "../../../components/QueuedDrawer";
import { EthStakingProviders } from "./types";
import { EthereumStakingDrawerBody } from "./EthereumStakingDrawerBody";
import { Track } from "../../../analytics";

type Props = unknown;

export function EthereumStakingDrawer(_: Props) {
  const { t } = useTranslation();
  const { params } = useRoute();
  const [isOpen, setIsOpen] = useState(true);
  const ethStakingProviders = useFeature<EthStakingProviders>(
    "ethStakingProviders",
  );

  console.log("%cindex.tsx line:22 params", "color: #007acc;", params);

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
      <Flex rowGap={52}>
        <Track onMount event="ETH Stake Modal" />
        <EthereumStakingDrawerBody
          providers={ethStakingProviders.params!.listProvider}
        />
        <Button onPress={onClose} type="main">
          {t("stake.ethereum.close")}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}
