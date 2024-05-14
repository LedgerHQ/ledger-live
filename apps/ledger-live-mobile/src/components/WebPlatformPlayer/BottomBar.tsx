import React, { RefObject, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { ArrowLeftMedium, ArrowRightMedium, ReverseMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTheme } from "styled-components/native";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { useDappCurrentAccount } from "@ledgerhq/live-common/wallet-api/useDappLogic";
import { safeGetRefValue, CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";
import Button from "../Button";
import { Trans } from "react-i18next";
import CircleCurrencyIcon from "../CircleCurrencyIcon";
import { useSelectAccount } from "../Web3AppWebview/helpers";
import { useMaybeAccountName } from "~/reducers/wallet";

type BottomBarProps = {
  manifest: AppManifest;
  webviewAPIRef: RefObject<WebviewAPI>;
  webviewState: WebviewState;
  currentAccountHistDb: CurrentAccountHistDB;
};

function IconButton({
  children,
  onPress,
  disabled,
  ...flexProps
}: React.PropsWithChildren<
  {
    children: React.ReactNode;
    disabled?: boolean;
    onPress: () => void;
  } & React.ComponentProps<typeof Flex>
>) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <Flex justifyContent="center" alignItems="center" height={40} width={40} {...flexProps}>
        {children}
      </Flex>
    </TouchableOpacity>
  );
}

export function BottomBar({
  manifest,
  webviewAPIRef,
  webviewState,
  currentAccountHistDb,
}: BottomBarProps) {
  const { colors } = useTheme();
  const { currentAccount } = useDappCurrentAccount(currentAccountHistDb);
  const shouldDisplaySelectAccount = !!manifest.dapp;

  const handleForward = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.goForward();
  }, [webviewAPIRef]);

  const handleBack = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.goBack();
  }, [webviewAPIRef]);

  const handleReload = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.reload();
  }, [webviewAPIRef]);

  const { onSelectAccount } = useSelectAccount({ manifest, currentAccountHistDb });

  const currentAccountName = useMaybeAccountName(currentAccount);

  return (
    <Flex flexDirection="row" paddingY={4} paddingX={4} alignItems="center">
      <Flex flexDirection="row" flex={1}>
        <IconButton onPress={handleBack} marginRight={4} disabled={!webviewState.canGoBack}>
          <ArrowLeftMedium
            size={24}
            color={webviewState.canGoBack ? colors.neutral.c100 : colors.neutral.c50}
          />
        </IconButton>

        <IconButton onPress={handleForward} disabled={!webviewState.canGoForward}>
          <ArrowRightMedium
            size={24}
            color={webviewState.canGoForward ? colors.neutral.c100 : colors.neutral.c50}
          />
        </IconButton>
      </Flex>

      {shouldDisplaySelectAccount ? (
        <Button type="primary" onPress={onSelectAccount}>
          {!currentAccount ? (
            <Text>
              <Trans i18nKey="common.selectAccount" />
            </Text>
          ) : (
            <Flex flexDirection="row" height={50} alignItems="center" justifyContent="center">
              <CircleCurrencyIcon
                size={24}
                currency={
                  currentAccount.type === "TokenAccount"
                    ? currentAccount.token
                    : currentAccount.currency
                }
              />
              <Text color={"neutral.c20"} ml={4}>
                {currentAccountName}
              </Text>
            </Flex>
          )}
        </Button>
      ) : null}

      <IconButton onPress={handleReload} alignSelf="flex-end">
        <ReverseMedium size={24} color="neutral.c100" />
      </IconButton>
    </Flex>
  );
}
