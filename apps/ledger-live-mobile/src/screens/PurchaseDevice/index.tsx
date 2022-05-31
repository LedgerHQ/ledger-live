import React, { memo, useCallback, useState } from "react";
import { Flex, Icons } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/lib/featureFlags";
import { useNavigation } from "@react-navigation/native";
import { WebViewMessageEvent } from "react-native-webview";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import Button from "../../components/wrappedUi/Button";
import logger from "../../logger";
import DebugURLDrawer from "./DebugURLDrawer";
import { PurchaseMessage } from "./types";
import DebugMessageDrawer from "./DebugMessageDrawer";
import WebViewScreen from "../../components/WebViewScreen";
import { NavigatorName, ScreenName } from "../../const";
import { pushDelayedTrackingEvent } from "../../components/DelayedTrackingProvider";
import { completeOnboarding, setReadOnlyMode } from "../../actions/settings";
import { urls } from "../../config/urls";

const defaultURL = urls.buyNanoX;

const PurchaseDevice = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const buyDeviceFromLive = useFeature("buyDeviceFromLive");

  const [isURLDrawerOpen, setURLDrawerOpen] = useState(false);
  const [isMessageDrawerOpen, setMessageDrawerOpen] = useState(false);
  const [url, setUrl] = useState(buyDeviceFromLive?.params?.url || defaultURL);
  const [message, setMessage] = useState<PurchaseMessage | null>(null);

  const handleBack = useCallback(() => {
    navigation.navigate(
      NavigatorName.BuyDevice as never,
      {
        screen: ScreenName.GetDevice,
      } as never,
    );
  }, [navigation]);

  const handleOpenDrawer = useCallback(() => {
    setURLDrawerOpen(true);
  }, [setURLDrawerOpen]);

  const handleAdjustTracking = useCallback((data: PurchaseMessage) => {
    pushDelayedTrackingEvent({
      type: "adjust",
      payload: {
        id: `${data.type}-${data.value?.deviceId}`,
        revenue: data.value?.price,
        currency: data.value?.currency,
      },
    });
  }, []);

  const handleOnboardingStates = useCallback(
    (data: PurchaseMessage) => {
      if (data.type === "ledgerLiveOrderSuccess") {
        dispatch(setReadOnlyMode(true));
        dispatch(completeOnboarding());
        // TODO: dispatch this when Reborn is merged
        // dispatch(hasOrderedNano(true));
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
    <>
      <WebViewScreen
        screenName={t("purchaseDevice.pageTitle")}
        uri={url}
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
            <Button Icon={Icons.ArrowLeftMedium} onPress={handleBack} />
            <Button Icon={Icons.FiltersMedium} onPress={handleOpenDrawer} />
          </Flex>
        )}
      />
      <DebugMessageDrawer
        isOpen={isMessageDrawerOpen}
        message={message}
        onClose={() => setMessageDrawerOpen(false)}
      />
      <DebugURLDrawer
        isOpen={isURLDrawerOpen}
        value={url}
        onClose={() => setURLDrawerOpen(false)}
        onChange={setUrl}
      />
    </>
  );
};

export default memo(PurchaseDevice);
