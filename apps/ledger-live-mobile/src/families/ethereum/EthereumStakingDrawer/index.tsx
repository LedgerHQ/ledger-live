import React, { useCallback, useEffect, useState } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Button, Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";

import QueuedDrawer from "../../../components/QueuedDrawer";
import { EthStakingProviders } from "./types";
import { EthereumStakingDrawerBody } from "./EthereumStakingDrawerBody";
import { Track } from "../../../analytics";

type Props = {
  drawer?: {
    id: string;
    props: {
      accountId: string;
      singleProviderRedirectMode?: boolean;
    };
  };
};

export function EthereumStakingDrawer({ drawer }: Props) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ethStakingProviders = useFeature<EthStakingProviders>("ethStakingProviders");

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  useEffect(() => {
    setIsOpen(drawer?.id === "EthStakingDrawer");
  }, [drawer]);

  if (
    !drawer ||
    !ethStakingProviders?.enabled ||
    (ethStakingProviders.params?.listProvider ?? []).length < 1
  ) {
    return null;
  }

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
      <Flex rowGap={52}>
        <Track onMount event="ETH Stake Modal" />
        <EthereumStakingDrawerBody
          singleProviderRedirectMode={drawer.props.singleProviderRedirectMode ?? true}
          accountId={drawer.props.accountId}
          providers={ethStakingProviders.params!.listProvider}
        />
        <Button onPress={onClose} type="main">
          {t("stake.ethereum.close")}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}
