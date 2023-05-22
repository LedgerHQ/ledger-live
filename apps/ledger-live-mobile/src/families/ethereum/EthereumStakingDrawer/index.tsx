import React, { useCallback, useState } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Button, Flex } from "@ledgerhq/native-ui";

import QueuedDrawer from "../../../components/QueuedDrawer";
import { EthStakingProviders } from "./types";
import { EthereumStakingDrawerBody } from "./EthereumStakingDrawerBody";
import { useTranslation } from "react-i18next";
import { SafeAreaFrameContext } from "react-native-safe-area-context";
import { SafeAreaView } from "react-native";

type Props = unknown;

export function EthereumStakingDrawer(_: Props) {
  const { t } = useTranslation();
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
      <Flex rowGap={52}>
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
