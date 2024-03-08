import React, { RefObject, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { ArrowLeftMedium, ArrowRightMedium, ReverseMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTheme } from "styled-components/native";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { safeGetRefValue, useManifestCurrencies } from "@ledgerhq/live-common/wallet-api/react";
import { useDappCurrentAccount } from "@ledgerhq/live-common/wallet-api/useDappLogic";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import Button from "../Button";
import { Trans } from "react-i18next";
import { getAccountName } from "@ledgerhq/live-common/account/index";
import CircleCurrencyIcon from "../CircleCurrencyIcon";

type BottomBarProps = {
  manifest: AppManifest;
  webviewAPIRef: RefObject<WebviewAPI>;
  webviewState: WebviewState;
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

export function BottomBar({ manifest, webviewAPIRef, webviewState }: BottomBarProps) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { currentAccount, setCurrentAccount } = useDappCurrentAccount();
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

  const currencies = useManifestCurrencies(manifest);

  const onSelectAccount = useCallback(() => {
    if (currencies.length === 1) {
      navigation.navigate(NavigatorName.RequestAccount, {
        screen: ScreenName.RequestAccountsSelectAccount,
        params: {
          currency: currencies[0],
          allowAddAccount: true,
          onSuccess: account => {
            setCurrentAccount(account);
          },
        },
      });
    } else {
      navigation.navigate(NavigatorName.RequestAccount, {
        screen: ScreenName.RequestAccountsSelectCrypto,
        params: {
          currencies,
          allowAddAccount: true,
          onSuccess: account => {
            setCurrentAccount(account);
          },
        },
      });
    }
  }, [currencies, navigation, setCurrentAccount]);

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
              <Text ml={4}>{getAccountName(currentAccount)}</Text>
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
