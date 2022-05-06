import React, { memo, useCallback, useState } from "react";
import { Flex, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { WebViewMessageEvent } from "react-native-webview";
import { useTranslation } from "react-i18next";
import { Adjust, AdjustEvent } from "react-native-adjust";

import Button from "../../components/wrappedUi/Button";
import logger from "../../logger";
import DebugURLDrawer from "./DebugURLDrawer";
import { PurchaseMessage } from "./types";
import DebugMessageDrawer from "./DebugMessageDrawer";
import WebViewScreen from "../../components/WebViewScreen";
import { ScreenName } from "../../const";

// const defaultURL = urls.buyNanoX;
const defaultURL =
  "https://ledgerstore-dev.myshopify.com/products/ledger-nano-x/?_ab=0&_fd=0&_sc=1&key=16af786e8c3e41d054096a00e8e3aa4f148f45007b0dd8ea43181ea9fcefcc69&preview_theme_id=129096581308&utm_medium=self_referral&utm_source=ledger_live_mobile&utm_content=onboarding";

const PurchaseDevice = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isURLDrawerOpen, setURLDrawerOpen] = useState(false);
  const [isMessageDrawerOpen, setMessageDrawerOpen] = useState(false);
  const [url, setUrl] = useState(defaultURL);
  const [message, setMessage] = useState<PurchaseMessage | null>(null);

  const handleBack = useCallback(() => {
    navigation.navigate(ScreenName.BuyDevice as any);
  }, [navigation]);

  const handleOpenDrawer = useCallback(() => {
    setURLDrawerOpen(true);
  }, [setURLDrawerOpen]);

  const handleAdjustTracking = useCallback((data: PurchaseMessage) => {
    const event = new AdjustEvent(`${data.type}-${data.value?.deviceId}`);
    if (
      data.type === "ledgerLiveOrderSuccess" &&
      data.value?.price &&
      data.value?.currency
    ) {
      event.setRevenue(data.value.price, data.value.currency);
    }
    Adjust.trackEvent(event);
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
