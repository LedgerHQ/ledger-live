import React, { useRef, useState, useCallback } from "react";
import { Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/native-ui/index";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import { OptionButton } from "./OptionButton";
import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import {
  StackNavigatorProps,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { isCryptoOrTokenCurrency } from "LLM/utils/isCryptoOrTokenCurrency";
import { isObject } from "LLM/utils/isObject";
import QueuedDrawerGorhom from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import { useOpenReceiveDrawer } from "LLM/features/Receive";

// Fiat provider manifest ID for Noah integration
const FIAT_PROVIDER_MANIFEST_ID = "noah";

type EntryScreens = ScreenName.ReceiveConfirmation;

type EntryScreenProps = {
  [K in EntryScreens]: StackNavigatorProps<ReceiveFundsStackParamList, K>;
}[EntryScreens];

export default function ReceiveFundsOptions(props: EntryScreenProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useTranslation();
  const { navigation } = props;
  const isNavigatingRef = useRef(false);
  const { handleOpenReceiveDrawer, isModularDrawerEnabled } = useOpenReceiveDrawer({
    currency: isCryptoOrTokenCurrency(props.route.params?.currency)
      ? props.route.params?.currency
      : undefined,
    sourceScreenName: props.route.name,
  });

  function handleGoToFiat() {
    isNavigatingRef.current = true;
    navigation.replace(ScreenName.ReceiveProvider, {
      manifestId: FIAT_PROVIDER_MANIFEST_ID,
      fromMenu: true,
    });
  }

  function handleGoToCrypto() {
    if (isModularDrawerEnabled) {
      handleClose();
      handleOpenReceiveDrawer();
      return;
    }

    isNavigatingRef.current = true;
    typesafeNavigation(props);
  }

  function handleClose() {
    setIsOpen(false);
  }

  const handleModalHide = useCallback(() => {
    if (isNavigatingRef.current && !isModularDrawerEnabled) {
      return;
    }

    const parent = navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
    if (parent && "pop" in parent && parent.canGoBack()) {
      parent.pop();
    }
  }, [navigation, isModularDrawerEnabled]);

  return (
    <QueuedDrawerGorhom
      isRequestingToBeOpened={isOpen}
      snapPoints={["35%", "55%"]}
      onClose={handleClose}
      onModalHide={handleModalHide}
    >
      <TrackScreen category="Deposit" name="Options" />
      <Text textAlign="center" fontSize={24} mb={5}>
        {t("transfer.receive.title")}
      </Text>
      <OptionButton
        onPress={handleGoToFiat}
        title={t("transfer.receive.menu.fiat.title")}
        subtitle={t("transfer.receive.menu.fiat.description")}
        Icon={Icons.Bank}
      />
      <OptionButton
        onPress={handleGoToCrypto}
        title={t("transfer.receive.menu.crypto.title")}
        subtitle={t("transfer.receive.menu.crypto.description")}
        Icon={Icons.CoinsCrypto}
      />
    </QueuedDrawerGorhom>
  );
}

function typesafeNavigation({ route, navigation }: EntryScreenProps) {
  switch (route.name) {
    case ScreenName.ReceiveConfirmation: {
      if (!isReceiveConfirmationParams(route.params)) {
        return;
      }
      navigation.navigate(ScreenName.ReceiveConfirmation, {
        ...route.params,
        fromMenu: true,
      });
      break;
    }
  }
}

function isReceiveConfirmationParams(
  params: unknown,
): params is ReceiveFundsStackParamList[ScreenName.ReceiveConfirmation] {
  return isObject(params) && typeof params["accountId"] === "string";
}
