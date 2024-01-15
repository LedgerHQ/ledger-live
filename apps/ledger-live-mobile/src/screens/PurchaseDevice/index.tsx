import React, { memo, useCallback, useState, useMemo } from "react";
import { Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import SafeAreaView from "~/components/SafeAreaView";
import { useNavigation } from "@react-navigation/native";
import { WebViewMessageEvent } from "react-native-webview";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import { Adjust, AdjustEvent } from "react-native-adjust";
import Config from "react-native-config";
import Button from "~/components/wrappedUi/Button";
import logger from "../../logger";
import DebugURLDrawer from "./DebugURLDrawer";
import { PurchaseMessage } from "./types";
import DebugMessageDrawer from "./DebugMessageDrawer";
import WebViewScreen from "~/components/WebViewScreen";
import { completeOnboarding, setReadOnlyMode } from "~/actions/settings";
import { urls } from "~/utils/urls";

const defaultURL = urls.buyNanoX;

const PurchaseDevice = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const buyDeviceFromLive = useFeature("buyDeviceFromLive");

  const [isURLDrawerOpen, setURLDrawerOpen] = useState(false);
  const [isMessageDrawerOpen, setMessageDrawerOpen] = useState(false);
  const [url, setUrl] = useState(buyDeviceFromLive?.params?.url || defaultURL);
  const urlWithParam = useMemo(() => {
    const appTrackingParam = "apptracking=false";

    if (!url || url.includes(appTrackingParam)) {
      return url;
    }
    if (url.includes("?")) {
      return url.concat(`&${appTrackingParam}`);
    }
    return url.concat(`?${appTrackingParam}`);
  }, [url]);
  const [message, setMessage] = useState<PurchaseMessage | null>(null);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleOpenDrawer = useCallback(() => {
    setURLDrawerOpen(true);
  }, [setURLDrawerOpen]);

  const handleAdjustTracking = useCallback((data: PurchaseMessage) => {
    const ids = {
      nanoS: Config.ADJUST_BUY_NANOS_EVENT_ID,
      nanoX: Config.ADJUST_BUY_NANOX_EVENT_ID,
      nanoSP: Config.ADJUST_BUY_NANOSP_EVENT_ID,
    };
    const id = data.value?.deviceId
      ? ids[data.value.deviceId as keyof typeof ids] || Config.ADJUST_BUY_GENERIC_EVENT_ID
      : Config.ADJUST_BUY_GENERIC_EVENT_ID;

    if (!id) {
      return;
    }

    const revenue = data.value?.price;
    const currency = data.value?.currency;

    const adjustEvent = new AdjustEvent(id);

    if (revenue && currency) {
      adjustEvent.setRevenue(revenue, currency);
    }

    Adjust.trackEvent(adjustEvent);
  }, []);

  const handleOnboardingStates = useCallback(
    (data: PurchaseMessage) => {
      if (data.type === "ledgerLiveOrderSuccess") {
        dispatch(setReadOnlyMode(true));
        dispatch(completeOnboarding());
      }
    },
    [dispatch],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (event?.nativeEvent?.data) {
        try {
          const data: PurchaseMessage = JSON.parse(event.nativeEvent.data);
          setMessage(data);
          setMessageDrawerOpen(true);
          handleAdjustTracking(data);
          handleOnboardingStates(data);
        } catch (error) {
          logger.critical(error as Error);
        }
      }
    },
    [handleAdjustTracking, handleOnboardingStates],
  );

  return (
    <SafeAreaView isFlex>
      <WebViewScreen
        screenName={t("purchaseDevice.pageTitle")}
        uri={urlWithParam}
        onMessage={handleMessage}
        renderHeader={() => (
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            width="100%"
            height={48}
            zIndex={1}
          >
            <Button Icon={IconsLegacy.ArrowLeftMedium} onPress={handleBack} />
            {buyDeviceFromLive?.params?.debug && (
              <Button Icon={IconsLegacy.FiltersMedium} onPress={handleOpenDrawer} />
            )}
          </Flex>
        )}
      />
      {buyDeviceFromLive?.params?.debug && (
        <DebugMessageDrawer
          isOpen={isMessageDrawerOpen}
          message={message}
          onClose={() => setMessageDrawerOpen(false)}
        />
      )}
      {buyDeviceFromLive?.params?.debug && (
        <DebugURLDrawer
          isOpen={isURLDrawerOpen}
          value={urlWithParam}
          onClose={() => setURLDrawerOpen(false)}
          onChange={setUrl}
        />
      )}
    </SafeAreaView>
  );
};

export default memo(PurchaseDevice);
