import React, { useCallback, useEffect, useState } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Button, Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";

import QueuedDrawer from "../../../components/QueuedDrawer";
import { EthStakingProviders } from "./types";
import { EthereumStakingDrawerBody } from "./EthereumStakingDrawerBody";
import { Track } from "../../../analytics";
import { StakingDrawerNavigationProps } from "../../../components/Stake/types";
import { ParamListBase, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { NavigatorName } from "../../../const";

type Props = {
  drawer?: StakingDrawerNavigationProps;
};

export function EthereumStakingDrawer({ drawer }: Props) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const navigation = useNavigation<StackNavigationProp<ParamListBase, string, NavigatorName>>();
  const ethStakingProviders = useFeature<EthStakingProviders>("ethStakingProviders");

  const onModalHide = useCallback(() => {
    // once the modal is hidden remove from params
    const parent = navigation.getParent(NavigatorName.RootNavigator);
    if (parent) {
      parent.setParams({ drawer: undefined });
    }
  }, [navigation]);

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
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose} onModalHide={onModalHide}>
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
