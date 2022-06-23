// @flow

import React, { useCallback, useEffect, useRef, useState } from "react";
import { of } from "rxjs";
import { delay } from "rxjs/operators";
import { TouchableOpacity, TouchableWithoutFeedback, Share } from "react-native";
import { useSelector } from "react-redux";
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
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import type { DeviceModelId } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useTheme } from "styled-components/native";
import { Flex, Text, Icons, Button } from "@ledgerhq/native-ui";
import getWindowDimensions from "../../logic/getWindowDimensions";
import { accountScreenSelector } from "../../reducers/accounts";
import PreventNativeBack from "../../components/PreventNativeBack";
import BottomModal from "../../components/BottomModal";
import CurrencyIcon from "../../components/CurrencyIcon";
import CopyLink from "../../components/CopyLink";
import NavigationScrollView from "../../components/NavigationScrollView";
import SkipLock from "../../components/behaviour/SkipLock";
import logger from "../../logger";
import { rejectionOp } from "../../logic/debugReject";
import GenericErrorView from "../../components/GenericErrorView";
import ReceiveSecurityModal from "./ReceiveSecurityModal";
import AdditionalInfoModal from "./AdditionalInfoModal";

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
  modelId: DeviceModelId,
  wired: boolean,
  device?: Device,
  onSuccess?: (address?: string) => void,
  onError?: () => void,
};

export default function ReceiveConfirmation({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const { t } = useTranslation();

  const [verified, setVerified] = useState(false);
  const [isToastDisplayed, setIsToastDisplayed] = useState(true);
  const [isModalOpened, setIsModalOpened] = useState(false);
  const onModalHide = useRef(() => {});
  const [error, setError] = useState(null);
  const [allowNavigation, setAllowNavigation] = useState(true);
  const [isAddionalInfoModalOpen, setIsAddionalInfoModalOpen] = useState(false);
  const sub = useRef();

  const hideToast = useCallback(() => {
    setIsToastDisplayed(false);
  }, []);

  const openAdditionalInfoModal = useCallback(() => {
    setIsAddionalInfoModalOpen(true);
    hideToast();
  }, [setIsAddionalInfoModalOpen, hideToast]);

  const closeAdditionalInfoModal = useCallback(() => {
    setIsAddionalInfoModalOpen(false);
  }, [setIsAddionalInfoModalOpen]);

  const { onSuccess, onError } = route.params;

  const verifyOnDevice = useCallback(
    async (device: Device): Promise<void> => {
      if (!account) return;
      const mainAccount = getMainAccount(account, parentAccount);

      sub.current = (mainAccount.id.startsWith("mock")
        ? of({}).pipe(delay(1000), rejectionOp())
        : getAccountBridge(mainAccount).receive(mainAccount, {
            deviceId: device.deviceId,
            verify: true,
          })
      ).subscribe({
        complete: () => {
          setVerified(true);
          setAllowNavigation(true);
          onSuccess && onSuccess(mainAccount.freshAddress);
        },
        error: error => {
          if (error && error.name !== "UserRefusedAddress") {
            logger.critical(error);
          }
          setError(error);
          setIsModalOpened(true);
          setAllowNavigation(true);
          onError && onError();
        },
      });
    },
    [account, onError, onSuccess, parentAccount],
  );

  function onRetry(): void {
    if (isModalOpened) {
      setIsModalOpened(false);
      onModalHide.current = navigation.goBack;
    } else {
      navigation.goBack();
    }
  }

  function onModalClose(): void {
    setIsModalOpened(false);
    onModalHide.current = onDone;
  }

  function onDone(): void {
    const n = navigation.getParent();
    if (n) {
      n.pop();
    }
  }

  const { width } = getWindowDimensions();
  const QRSize = Math.round(width / 1.8 - 16);
  const mainAccount = account && getMainAccount(account, parentAccount);
  const currency = account && getAccountCurrency(account);

  useEffect(() => {
    if (!allowNavigation) {
      navigation.setOptions({
        headerLeft: null,
        headerTitle: getAccountName(account),
        headerRight: () => null,
        gestureEnabled: false,
      });
    } else {
      navigation.setOptions({
        headerTitle: getAccountName(account),
      });
    }
  }, [allowNavigation, colors, navigation, account]);

  useEffect(() => {
    const device = route.params.device;

    if (device && !verified) {
      verifyOnDevice(device);
    }
    setAllowNavigation(true);
  }, [route.params, verified, verifyOnDevice]);

  const onShare = useCallback(() => {
    if (mainAccount?.freshAddress) {
      Share.share({ message: mainAccount?.freshAddress });
    }
  }, [mainAccount?.freshAddress]);

  if (!account || !currency || !mainAccount) return null;

  return (
    <Flex flex={1}>
      {allowNavigation ? null : (
        <>
          <PreventNativeBack />
          <SkipLock />
        </>
      )}
      <NavigationScrollView style={{ flex: 1 }}>
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
            width={QRSize*1/3}
            height={QRSize*1/3}
            bg="constant.white"
            position="absolute"
          >
            <CurrencyIcon
              currency={currency}
              color={colors.constant.white}
              bg={currency.color}
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
      <Button type="shade" outline size="large" m={6} mb={8} onPress={onShare}>
        {t("transfer.receive.shareAddress")}
      </Button>
      {isToastDisplayed ? (
        <Flex
          left={0}
          right={0}
          bottom={8}
          position="absolute"
          bg="neutral.c100"
          mx={6}
          borderRadius={8}
        >
          <TouchableWithoutFeedback onPress={openAdditionalInfoModal}>
            <Flex
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            >
              <Flex flex={1} px={6} py={7} borderRadius={8} alignItems="center">
                <Icons.CircledCheckMedium color="neutral.c00" size={24} />
              </Flex>
              <Flex width="70%">
                <Text variant="body" fontWeight="semiBold" color="neutral.c00">
                  {t("transfer.receive.toastMessages.accountImported", { currencyTicker: currency.ticker })}
                  <Text variant="body" fontWeight="semiBold" color="primary.c70" style={{ textDecorationLine: "underline" }}>
                    {t("transfer.receive.toastMessages.why")}
                  </Text>
                </Text>
              </Flex>
              <TouchableWithoutFeedback onPress={hideToast}>
                <Flex flex={1} py={7} pr={6} pl={3} borderRadius={8} alignItems="center">
                  <Icons.CloseMedium color="neutral.c00" size={20} />
                </Flex>
              </TouchableWithoutFeedback>
            </Flex>
          </TouchableWithoutFeedback>
        </Flex>
       ) : null}
      <ReceiveSecurityModal onVerifyAddress={onRetry} />
      <AdditionalInfoModal
        isOpen={isAddionalInfoModalOpen}
        onClose={closeAdditionalInfoModal}
        currencyTicker={currency.ticker}
      />
      <BottomModal
        id="ReceiveConfirmationModal"
        isOpened={isModalOpened}
        onClose={onModalClose}
        onModalHide={onModalHide.current}
      >
        {error ? (
          <Flex flexDirection="column">
            <GenericErrorView error={error} />
            <Flex flexDirection="row" justifyContent="flex-end" flexGrow={1} my={3}>
              <Button
                event="ReceiveRetry"
                type="primary"
                title={<Trans i18nKey="common.retry" />}
                containerStyle={{ flexGrow: 2 }}
                onPress={onRetry}
              />
            </Flex>
          </Flex>
        ) : null}
      </BottomModal>
    </Flex>
  );
}
