import React, { memo, useCallback, useState } from "react";
import { Flex, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { WebViewMessageEvent } from "react-native-webview";
import { useTranslation } from "react-i18next";

import Button from "../../components/wrappedUi/Button";
import logger from "../../logger";
import DebugURLDrawer from "./DebugURLDrawer";
import { PurchaseMessage } from "./types";
import DebugMessageDrawer from "./DebugMessageDrawer";
import WebViewScreen from "../../components/WebViewScreen";
import { NavigatorName, ScreenName } from "../../const";
import { pushDelayedTrackingEvent } from "../../components/DelayedTrackingProvider";

// const defaultURL = urls.buyNanoX;
const defaultURL =
  "https://ledgerstore-dev.myshopify.com/products/ledger-nano-x/?_ab=0&_fd=0&_sc=1&key=f75e14afa4723d02d7b736f4786cbfcc73176f6f6bc65d786081e68f9360c1bf&preview_theme_id=129527414972&utm_medium=self_referral&utm_source=ledger_live_mobile&utm_content=onboarding";

const PurchaseDevice = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isURLDrawerOpen, setURLDrawerOpen] = useState(false);
  const [isMessageDrawerOpen, setMessageDrawerOpen] = useState(false);
  const [url, setUrl] = useState(defaultURL);
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
    // TODO: Dispatch redux event if data.type === "ledgerLiveOrderSuccess" in
    // order to update UI
  }, []);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (event?.nativeEvent?.data) {
        try {
          const data: PurchaseMessage = JSON.parse(event.nativeEvent.data);
          setMessage(data);
          setMessageDrawerOpen(true);
          handleAdjustTracking(data);
        } catch (error) {
          logger.critical(error as Error);
        }
      }
    },
    [handleAdjustTracking],
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
