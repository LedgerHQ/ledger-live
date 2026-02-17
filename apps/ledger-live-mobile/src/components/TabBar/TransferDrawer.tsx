import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { ScrollView } from "react-native-gesture-handler";
import { Flex, Text, Box } from "@ledgerhq/native-ui";
import { Linking, StyleProp, ViewStyle } from "react-native";
import snakeCase from "lodash/snakeCase";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { NavigatorName } from "~/const";
import { hasOrderedNanoSelector, readOnlyModeEnabledSelector } from "~/reducers/settings";
import { Props as ModalProps } from "../QueuedDrawer";
import TransferButton from "../TransferButton";
import BuyDeviceBanner, {
  IMAGE_PROPS_BUY_DEVICE_FLEX_BOX,
} from "LLM/features/Reborn/components/BuyDeviceBanner";
import SetupDeviceBanner from "LLM/features/Reborn/components/SetupDeviceBanner";
import { track, useAnalytics } from "~/analytics";
import useQuickActions, { QuickAction } from "~/hooks/useQuickActions";
import { PTX_SERVICES_TOAST_ID } from "~/utils/constants";
import { useQuickAccessURI } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";
import { useToastsActions } from "~/actions/toast";

type ButtonItem = {
  title: string;
  description: string;
  tag?: string;
  Icon: IconType;
  onPress?: (() => void) | null;
  onDisabledPress?: () => void;
  disabled?: boolean;
  event?: string;
  eventProperties?: Parameters<typeof track>[1];
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export default function TransferDrawer({ onClose }: Omit<ModalProps, "isRequestingToBeOpened">) {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { quickActionsList } = useQuickActions();
  const { SEND, RECEIVE, BUY, SELL, SWAP, STAKE, RECOVER } = quickActionsList;
  const stakeLabel = getStakeLabelLocaleBased();
  const { t } = useTranslation();
  const { pushToast, dismissToast } = useToastsActions();
  const noah = useFeature("noah");

  const { page } = useAnalytics();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);

  const ptxServiceCtaExchangeDrawer = useFeature("ptxServiceCtaExchangeDrawer");

  const isPtxServiceCtaExchangeDrawerDisabled = useMemo(
    () => !(ptxServiceCtaExchangeDrawer?.enabled ?? true),
    [ptxServiceCtaExchangeDrawer],
  );

  const recoverConfig = useFeature("protectServicesMobile");

  const quickAccessURI = useQuickAccessURI(recoverConfig);

  const onPress = useCallback(
    (action: QuickAction) => {
      if (action.customHandler) {
        action.customHandler();
      } else if (action.route) {
        navigation.navigate<keyof BaseNavigatorStackParamList>(...action.route);
      }
      onClose?.();
    },
    [navigation, onClose],
  );

  const onNavigateRecover = useCallback(() => {
    if (quickAccessURI) {
      Linking.canOpenURL(quickAccessURI).then(() => Linking.openURL(quickAccessURI));
    }
    onClose?.();
  }, [onClose, quickAccessURI]);

  const buttonsList: ButtonItem[] = [
    SEND && {
      eventProperties: {
        button: "transfer_send",
        page,
        drawer: "trade",
      },
      title: t("transfer.send.title"),
      description: t("transfer.send.description"),
      onPress: () => onPress(SEND),
      Icon: SEND.icon,
      disabled: SEND.disabled,
      testID: "transfer-send-button",
    },
    RECEIVE && {
      eventProperties: {
        button: "transfer_receive",
        page,
        drawer: "trade",
      },
      title: t("transfer.receive.title"),
      description: noah?.enabled
        ? t("transfer.receive.description_v2")
        : t("transfer.receive.description"),
      onPress: () => onPress(RECEIVE),
      Icon: RECEIVE.icon,
      disabled: RECEIVE.disabled,
      testID: "transfer-receive-button",
    },
    BUY && {
      eventProperties: {
        button: "transfer_buy",
        page,
        drawer: "trade",
      },
      title: t("transfer.buy.title"),
      description: t("transfer.buy.description"),
      Icon: BUY.icon,
      onPress: () => onPress(BUY),
      onDisabledPress: () => {
        if (isPtxServiceCtaExchangeDrawerDisabled) {
          onClose?.();
          dismissToast(PTX_SERVICES_TOAST_ID);
          pushToast({
            id: PTX_SERVICES_TOAST_ID,
            type: "success",
            title: t("notifications.ptxServices.toast.title"),
            icon: "info",
          });
        }
      },
      disabled: BUY.disabled,
      testID: "transfer-buy-button",
    },
    SELL && {
      eventProperties: {
        button: "transfer_sell",
        page,
        drawer: "trade",
      },
      title: t("transfer.sell.title"),
      description: t("transfer.sell.description"),
      Icon: SELL.icon,
      onPress: () => onPress(SELL),
      onDisabledPress: () => {
        if (isPtxServiceCtaExchangeDrawerDisabled) {
          onClose?.();
          dismissToast(PTX_SERVICES_TOAST_ID);
          pushToast({
            id: PTX_SERVICES_TOAST_ID,
            type: "success",
            title: t("notifications.ptxServices.toast.title"),
            icon: "info",
          });
        }
      },
      disabled: SELL.disabled,
      testID: "transfer-sell-button",
    },
    STAKE && {
      eventProperties: {
        button: "transfer_stake",
        page,
        drawer: "stake",
      },
      title: t(stakeLabel),
      description: t("transfer.stake.description"),
      Icon: STAKE.icon,
      onPress: () => onPress(STAKE),
      disabled: STAKE.disabled,
      testID: "transfer-stake-button",
    },
    SWAP && {
      eventProperties: {
        button: "transfer_swap",
        page,
        drawer: "trade",
      },
      title: t("transfer.swap.title"),
      description: t("transfer.swap.description"),
      Icon: SWAP.icon,
      onPress: () => onPress(SWAP),
      onDisabledPress: () => {
        if (isPtxServiceCtaExchangeDrawerDisabled) {
          onClose?.();
          dismissToast(PTX_SERVICES_TOAST_ID);
          pushToast({
            id: PTX_SERVICES_TOAST_ID,
            type: "success",
            title: t("notifications.ptxServices.toast.title"),
            icon: "info",
          });
        }
      },
      disabled: SWAP.disabled,
      testID: "transfer-swap-button",
    },
    RECOVER && {
      eventProperties: {
        button: "transfer_recover",
        page,
        drawer: "trade",
      },
      tag: t("transfer.recover.tag"),
      title: t("transfer.recover.title"),
      description: t("transfer.recover.description"),
      Icon: RECOVER.icon,
      onPress: () => onNavigateRecover(),
      disabled: RECOVER.disabled,
      testID: "transfer-recover-button",
    },
  ].filter(<T extends ButtonItem>(v: T | undefined): v is T => !!v);

  const bannerEventProperties = useMemo(
    () => ({
      banner: "You'll need a nano",
      button: "Buy a device",
      drawer: "transfer",
      page,
    }),
    [page],
  );

  let screen = "Wallet";

  // TODO : Find a way to get Assets and Asset screen names
  // * Currently, these 2 screen names are under NavigatorName.Portfolio's navigator
  switch (page) {
    case snakeCase(NavigatorName.Portfolio): {
      screen = "Wallet";
      break;
    }
    case snakeCase(NavigatorName.Market): {
      screen = "Market";
      break;
    }
    case snakeCase(NavigatorName.Discover): {
      screen = "Discover";
      break;
    }
    default: {
      break;
    }
  }

  return (
    <>
      <Flex flexDirection="column" alignItems="flex-start" p={7} pt={9} flex={1}>
        <ScrollView
          alwaysBounceVertical={false}
          style={{ width: "100%" }}
          testID="transfer-scroll-list"
        >
          {buttonsList.map((button, index) => (
            <Box mb={index === buttonsList.length - 1 ? 0 : 8} key={button.title}>
              <TransferButton {...button} testID={button.testID} />
            </Box>
          ))}
        </ScrollView>
      </Flex>
      {readOnlyModeEnabled && !hasOrderedNano && (
        <BuyDeviceBanner
          {...IMAGE_PROPS_BUY_DEVICE_FLEX_BOX}
          image="buyDoubleFlex"
          topLeft={
            <Text color="neutral.c00" mb={6} minHeight={36} fontSize="14px" fontWeight="semiBold">
              {t("buyDevice.bannerTitle2")}
            </Text>
          }
          buttonLabel={t("buyDevice.bannerButtonTitle2")}
          buttonSize="small"
          event="button_clicked"
          eventProperties={bannerEventProperties}
          screen={screen}
        />
      )}
      {readOnlyModeEnabled && hasOrderedNano ? (
        <Box mt={8} width={"100%"}>
          <SetupDeviceBanner screen={screen} />
        </Box>
      ) : null}
    </>
  );
}
