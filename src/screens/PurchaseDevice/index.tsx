import React, { memo, useCallback, useState } from "react";
import { SafeAreaView } from "react-native";
import { BottomDrawer, Flex, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import WebView from "react-native-webview";
import styled from "styled-components/native";
import { useTranslation } from "react-i18next";

import TextInput from "../../components/TextInput";
import Button from "../../components/wrappedUi/Button";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import { urls } from "../../config/urls";

const defaultURL = urls.buyNanoX;

const SafeContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.main};
  padding-top: ${extraStatusBarPadding}px;
`;

const StyledWebview = styled(WebView)`
  background-color: transparent;
`;

const PurchaseDevice = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [url, setUrl] = useState(defaultURL);
  const [urlInputValue, setUrlInputValue] = useState(url);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleOpenDrawer = useCallback(() => {
    setDrawerOpen(true);
  }, [setDrawerOpen]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setUrlInputValue(url);
  }, [setDrawerOpen, setUrlInputValue, url]);

  const handleSaveUrl = useCallback(() => {
    setDrawerOpen(false);
    setUrl(urlInputValue);
  }, [setDrawerOpen, setUrl, urlInputValue]);

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
        <StyledWebview source={{ uri: url }} />
      </Flex>
      <BottomDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={t("buyDevice.debugDrawer.title")}
        subtitle={t("buyDevice.debugDrawer.subtitle")}
      >
        <TextInput
          value={urlInputValue}
          onChangeText={setUrlInputValue}
          numberOfLines={1}
          placeholder="https://www.ledger.com/buy"
        />
        <Button type="main" mt={4} onPress={handleSaveUrl}>
          {t("buyDevice.debugDrawer.cta")}
        </Button>
      </BottomDrawer>
    </SafeContainer>
  );
};

export default memo(PurchaseDevice);
