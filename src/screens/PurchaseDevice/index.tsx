import React, { memo, useCallback, useState } from "react";
import { SafeAreaView } from "react-native";
import { Flex, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import styled from "styled-components/native";

import Button from "../../components/wrappedUi/Button";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import logger from "../../logger";
import DebugURLDrawer from "./DebugURLDrawer";
import { PurchaseMessage } from "./types";
import DebugMessageDrawer from "./DebugMessageDrawer";

// const defaultURL = urls.buyNanoX;
const defaultURL =
  "https://ledgerstore-dev.myshopify.com/products/ledger-nano-x/?_ab=0&_fd=0&_sc=1&key=16af786e8c3e41d054096a00e8e3aa4f148f45007b0dd8ea43181ea9fcefcc69&preview_theme_id=129096581308&utm_medium=self_referral&utm_source=ledger_live_mobile&utm_content=onboarding";

const SafeContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.main};
  padding-top: ${extraStatusBarPadding}px;
`;

const StyledWebview = styled(WebView)`
  background-color: transparent;
`;

const PurchaseDevice = () => {
  const navigation = useNavigation();
  const [isURLDrawerOpen, setURLDrawerOpen] = useState(false);
  const [isMessageDrawerOpen, setMessageDrawerOpen] = useState(false);
  const [url, setUrl] = useState(defaultURL);
  const [message, setMessage] = useState<PurchaseMessage | null>(null);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleOpenDrawer = useCallback(() => {
    setURLDrawerOpen(true);
  }, [setURLDrawerOpen]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    if (event?.nativeEvent?.data) {
      try {
        const data: PurchaseMessage = JSON.parse(event.nativeEvent.data);
        setMessage(data);
        setMessageDrawerOpen(true);
      } catch (error) {
        logger.critical(error as Error);
      }
    }
  }, []);

  return (
    <SafeContainer>
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
      <Flex flex={1}>
        <StyledWebview source={{ uri: url }} onMessage={handleMessage} />
      </Flex>
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
    </SafeContainer>
  );
};

export default memo(PurchaseDevice);
