import React, { useEffect } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Button, Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";

import { EthStakingProviders } from "./types";
import { EthereumStakingDrawerBody } from "./EthereumStakingDrawerBody";
import { Track } from "../../../analytics";
import QueuedDrawer from "../../../components/QueuedDrawer";
import { useRootDrawerContext } from "../../../context/RootDrawerContext";

export function EthereumStakingDrawer() {
  const { t } = useTranslation();
  const { isOpen, onModalHide, openDrawer, onClose, drawer } = useRootDrawerContext();
  const ethStakingProviders = useFeature<EthStakingProviders>("ethStakingProviders");

  useEffect(() => {
    if (
      ethStakingProviders?.enabled ||
      (ethStakingProviders?.params?.listProvider ?? []).length > 0
    ) {
      openDrawer();
    }
  }, [ethStakingProviders, openDrawer]);

  if (!ethStakingProviders) return null;

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose} onModalHide={onModalHide}>
      <Flex rowGap={52}>
        <Track onMount event="ETH Stake Modal" />
        <EthereumStakingDrawerBody
          onClose={onClose}
          singleProviderRedirectMode={drawer.props.singleProviderRedirectMode ?? true}
          accountId={drawer.props.accountId}
          providers={ethStakingProviders.params!.listProvider}
        />
        <Button onPress={() => onClose()} type="main">
          {t("stake.ethereum.close")}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}
