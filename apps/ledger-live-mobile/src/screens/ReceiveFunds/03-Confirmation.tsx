// @flow

import React, { useCallback, useEffect, useRef, useState } from "react";
import { TouchableOpacity, TouchableWithoutFeedback, Share } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import QRCode from "react-native-qrcode-svg";
import { useTranslation, Trans } from "react-i18next";
import type {
  Account,
  TokenAccount,
  AccountLike,
} from "@ledgerhq/live-common/lib/types";
import {
  getMainAccount,
  getAccountCurrency,
  getAccountName,
} from "@ledgerhq/live-common/lib/account";
import { useTheme } from "styled-components/native";
import { Flex, Text, Icons, Button, Notification } from "@ledgerhq/native-ui";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/src/types";
import { makeEmptyTokenAccount } from "@ledgerhq/live-common/src/account";
import { useRoute } from "@react-navigation/native";
import getWindowDimensions from "../../logic/getWindowDimensions";
import { accountScreenSelector } from "../../reducers/accounts";
import CurrencyIcon from "../../components/CurrencyIcon";
import CopyLink from "../../components/CopyLink";
import NavigationScrollView from "../../components/NavigationScrollView";
import ReceiveSecurityModal from "./ReceiveSecurityModal";
import AdditionalInfoModal from "./AdditionalInfoModal";
import { replaceAccounts } from "../../actions/accounts";
import { ScreenName } from "../../const";
import { track, TrackScreen } from "../../analytics";
import { usePreviousRouteName } from "../../helpers/routeHooks";

type Props = {
  account?: (TokenAccount | Account),
  parentAccount?: Account,
  navigation: any,
  route: { params: RouteParams },
  readOnlyModeEnabled: boolean,
};

type RouteParams = {
  account?: AccountLike,
  accountId: string,
  parentId?: string,
  modelId: DeviceModelId,
  wired: boolean,
  device?: Device,
  currency?: Currency,
  createTokenAccount?: boolean,
  onSuccess?: (address?: string) => void,
  onError?: () => void,
};

export default function ReceiveConfirmation({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const { t } = useTranslation();
  const verified = route.params?.verified;
  const [isModalOpened, setIsModalOpened] = useState(false);
  const [hasAddedTokenAccount, setHasAddedTokenAccount] = useState();
  const [isToastDisplayed, setIsToastDisplayed] = useState(false);
  const [isVerifiedToastDisplayed, setIsVerifiedToastDisplayed] = useState(verified);
  const onModalHide = useRef(() => {});
  const [isAddionalInfoModalOpen, setIsAddionalInfoModalOpen] = useState(false);
  const dispatch = useDispatch();
  const lastRoute = usePreviousRouteName()
  const routerRoute = useRoute();
  
  const hideToast = useCallback(() => {
    setIsToastDisplayed(false);
  }, []);
  const hideVerifiedToast = useCallback(() => {
    setIsVerifiedToastDisplayed(false);
  }, []);

  const openAdditionalInfoModal = useCallback(() => {
    track("notification_clicked", {
      button: "Imported and created account",
      screen: routerRoute.name
    })
    setIsAddionalInfoModalOpen(true);
    hideToast();
  }, [setIsAddionalInfoModalOpen, hideToast, routerRoute.name]);

  const closeAdditionalInfoModal = useCallback(() => {
    setIsAddionalInfoModalOpen(false);
  }, [setIsAddionalInfoModalOpen]);

  const onRetry = useCallback(() => {
    track("button_clicked", {
      button: "Verify your address",
      screen: routerRoute.name
    })
    const params = {...route.params, notSkippable: true}
    if (isModalOpened) {
      setIsModalOpened(false);
      onModalHide.current = () => navigation.navigate(ScreenName.ReceiveConnectDevice, params);
    } else {
      navigation.navigate(ScreenName.ReceiveConnectDevice, params);
    }
  }, [isModalOpened, navigation, route.params, routerRoute])

  const { width } = getWindowDimensions();
  const QRSize = Math.round(width / 1.8 - 16);
  const mainAccount = account && getMainAccount(account, parentAccount);
  const currency = route.params?.currency || (account && getAccountCurrency(account));

  useEffect(() => {
    if(route.params?.createTokenAccount && !hasAddedTokenAccount) {
      const newMainAccount = mainAccount;
      const emptyTokenAccount = makeEmptyTokenAccount(newMainAccount, currency);
      newMainAccount.subAccounts = [...newMainAccount.subAccounts, emptyTokenAccount];

      dispatch(replaceAccounts({ scannedAccounts: [newMainAccount], selectedIds: [newMainAccount.id], renamings: {}}));
      setIsToastDisplayed(true);
      setHasAddedTokenAccount(true);
    }
  }, [currency, route.params?.createTokenAccount, mainAccount, dispatch, hasAddedTokenAccount])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: getAccountName(account),
    });
  }, [colors, navigation, account]);

  useEffect(() => {
    setIsVerifiedToastDisplayed(verified)
    if(verified){
      track("Verification Success", { currency: currency.name })
    }
  }, [verified, currency.name])

  const onShare = useCallback(() => {
    track("button_clicked", {
      button: "Share",
      screen: routerRoute.name
    })
    if (mainAccount?.freshAddress) {
      Share.share({ message: mainAccount?.freshAddress });
    }
  }, [mainAccount?.freshAddress, routerRoute.name]);

  const onCopy = useCallback(() => {
    track("button_clicked", {
      button: "Copy",
      screen: routerRoute.name
    })
  }, [routerRoute.name])

  if (!account || !currency || !mainAccount) return null;

  return (
    <Flex flex={1} mb={9}>
      <NavigationScrollView style={{ flex: 1 }}>
        <TrackScreen category="ReceiveFunds" name="Receive Qr Code" source={lastRoute} currency={currency.name} />
        <Flex p={6} alignItems="center" justifyContent="center">
          <Text color="neutral.c100" fontWeight="semiBold" variant="h4" mb={3}>
            {t("transfer.receive.receiveConfirmation.title", { currencyTicker: currency.ticker })}
          </Text>
          <Flex>
          {verified ? (
            <Flex alignItems="center" justifyContent="center" flexDirection="row">
              <Icons.ShieldCheckMedium color="success.c100" size={16} />
              <Text color="success.c100" fontWeight="medium" variant="paragraphLineHeight" ml={2}>
                {t("transfer.receive.receiveConfirmation.addressVerified")}
              </Text>
            </Flex>
          ) : (
            <Flex>
              <TouchableOpacity onPress={onRetry}>
                <Flex alignItems="center" justifyContent="center" flexDirection="row">
                  <Icons.ShieldSecurityMedium color="warning.c100" size={16} />
                  <Text color="warning.c100" fontWeight="medium" variant="paragraphLineHeight" ml={2}>
                    {t("transfer.receive.receiveConfirmation.verifyAddress")}
                  </Text>
                </Flex>
              </TouchableOpacity>
              <Text variant="small" fontWeight="medium" color="neutral.c70" textAlign="center" mt={3}>
                {t("transfer.receive.receiveConfirmation.adviceVerify")}
              </Text>
            </Flex>
          )}
        </Flex>
        <Flex alignItems="center" justifyContent="center" mt={10}>
          <Flex
            p={6}
            borderRadius={24}
            position="relative"
            bg="constant.white"
            borderWidth={1}
            borderColor="neutral.c40"
          >
            <QRCode
              size={QRSize}
              value={mainAccount.freshAddress}
              ecl="H"
            />
          </Flex>
          <Flex
            alignItems="center"
            justifyContent="center"
            width={QRSize*0.3}
            height={QRSize*0.3}
            bg="constant.white"
            position="absolute"
          >
            <CurrencyIcon
              currency={currency}
              color={colors.constant.white}
              bg={currency?.color || currency.parentCurrency?.color || colors.constant.black}
              size={48}
              circle
            />
          </Flex>
        </Flex>
        <Flex mt={10} bg={"neutral.c30"} borderRadius={8} p={6} mx={6} flexDirection="row" width="100%" justifyContent={"space-between"}>
          <Text numberOfLines={1} width="75%" fontWeight="semiBold">
            {mainAccount.freshAddress}
          </Text>
          <CopyLink
            onCopy={onCopy}        
            string={mainAccount.freshAddress}
            replacement={<Trans i18nKey="transfer.receive.addressCopied" />}
          >
            {t("transfer.receive.copyAddress")}
          </CopyLink>
        </Flex>
        <Text variant="body" fontWeight="medium" color="neutral.c70" mt={6} textAlign="center">
          {t("transfer.receive.receiveConfirmation.sendWarning", { currencyName: currency.name, currencyTicker: currency.ticker })}
        </Text>
      </Flex>
      </NavigationScrollView>
      <Flex
        m={6}
      >
      {isToastDisplayed ? (
        <Notification
        Icon={Icons.CircledCheckMedium}
        variant={"neutral"}
        title={t("transfer.receive.toastMessages.accountImported", { currencyTicker: currency.ticker })}
        onClose={hideToast}
        linkText={t("transfer.receive.toastMessages.why")}
        onLinkPress={openAdditionalInfoModal}
        />
       ) : isVerifiedToastDisplayed ? <Notification
       Icon={Icons.CircledCheckMedium}
       variant={"success"}
       title={t("transfer.receive.toastMessages.addressVerified")}
       onClose={hideVerifiedToast}
       /> : <Button type="shade" outline size="large" onPress={onShare}>
        {t("transfer.receive.shareAddress")}
      </Button>}
      </Flex>
     {verified ? null : <ReceiveSecurityModal onVerifyAddress={onRetry} />}
      
      <AdditionalInfoModal
        isOpen={isAddionalInfoModalOpen}
        onClose={closeAdditionalInfoModal}
        currencyTicker={currency.ticker}
      />
    </Flex>
  );
}
