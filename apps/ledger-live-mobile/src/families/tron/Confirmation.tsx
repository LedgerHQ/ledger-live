import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { Button, Flex, Icons, Notification, Text } from "@ledgerhq/native-ui";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { useRoute } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Share, TouchableOpacity } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSelector } from "react-redux";
import { useTheme } from "styled-components/native";
import { track, TrackScreen } from "../../analytics";
import Alert from "../../components/Alert";
import CopyLink from "../../components/CopyLink";
import CurrencyIcon from "../../components/CurrencyIcon";
import NavigationScrollView from "../../components/NavigationScrollView";
import PreventNativeBack from "../../components/PreventNativeBack";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { ReceiveFundsStackParamList } from "../../components/RootNavigator/types/ReceiveFundsNavigator";
import { urls } from "../../config/urls";
import { ScreenName } from "../../const";
import getWindowDimensions from "../../logic/getWindowDimensions";
import { accountScreenSelector } from "../../reducers/accounts";
import AdditionalInfoModal from "../../screens/ReceiveFunds/AdditionalInfoModal";
import ReceiveSecurityModal from "../../screens/ReceiveFunds/ReceiveSecurityModal";

type ScreenProps = BaseComposite<
  StackNavigatorProps<
    ReceiveFundsStackParamList,
    ScreenName.ReceiveConfirmation | ScreenName.ReceiveVerificationConfirmation
  >
>;

type Props = {
  account?: TokenAccount | Account;
  parentAccount?: Account;
  readOnlyModeEnabled?: boolean;
} & ScreenProps;

export default function ReceiveConfirmation({ navigation }: Props) {
  const route = useRoute<ScreenProps["route"]>();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  return account ? (
    <ReceiveConfirmationInner
      navigation={navigation}
      route={route}
      account={account as Account | TokenAccount}
      parentAccount={parentAccount ?? undefined}
    />
  ) : null;
}

function ReceiveConfirmationInner({
  navigation,
  route,
  account,
  parentAccount,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const verified = route.params?.verified ?? false;
  const [isModalOpened, setIsModalOpened] = useState(true);
  const [isToastDisplayed, setIsToastDisplayed] = useState(false);
  const [isVerifiedToastDisplayed, setIsVerifiedToastDisplayed] =
    useState(verified);
  const [isAddionalInfoModalOpen, setIsAddionalInfoModalOpen] = useState(false);

  const hideToast = useCallback(() => {
    setIsToastDisplayed(false);
  }, []);
  const hideVerifiedToast = useCallback(() => {
    setIsVerifiedToastDisplayed(false);
  }, []);

  const openAdditionalInfoModal = useCallback(() => {
    track("notification_clicked", {
      button: "Imported and created account",
    });
    setIsAddionalInfoModalOpen(true);
    hideToast();
  }, [setIsAddionalInfoModalOpen, hideToast]);

  const closeAdditionalInfoModal = useCallback(() => {
    setIsAddionalInfoModalOpen(false);
  }, [setIsAddionalInfoModalOpen]);

  const onRetry = useCallback(() => {
    track("button_clicked", {
      button: "Verify your address",
    });
    const params = { ...route.params, notSkippable: true };
    setIsModalOpened(false);
    navigation.navigate(ScreenName.ReceiveConnectDevice, params);
  }, [navigation, route.params]);

  const { width } = getWindowDimensions();
  const QRSize = Math.round(width / 1.8 - 16);
  const mainAccount = account && getMainAccount(account, parentAccount);
  const currency =
    route.params?.currency || (account && getAccountCurrency(account));

  const onShare = useCallback(() => {
    track("button_clicked", {
      button: "Share",
    });
    if (mainAccount?.freshAddress) {
      Share.share({ message: mainAccount?.freshAddress });
    }
  }, [mainAccount?.freshAddress]);

  const onCopy = useCallback(() => {
    track("button_clicked", {
      button: "Copy",
    });
  }, []);

  if (!account || !currency || !mainAccount) return null;

  return (
    <Flex flex={1} mb={9}>
      <PreventNativeBack />
      <NavigationScrollView style={{ flex: 1 }}>
        <TrackScreen
          category="Receive"
          name="Qr Code"
          currency={currency.name}
        />
        <Flex p={6} alignItems="center" justifyContent="center">
          <Text color="neutral.c100" fontWeight="semiBold" variant="h4" mb={3}>
            {t("transfer.receive.receiveConfirmation.title", {
              currencyTicker: currency.ticker,
            })}
          </Text>
          <Flex>
            {verified ? (
              <Flex
                alignItems="center"
                justifyContent="center"
                flexDirection="row"
              >
                <Icons.ShieldCheckMedium color="success.c100" size={16} />
                <Text
                  color="success.c100"
                  fontWeight="medium"
                  variant="paragraphLineHeight"
                  ml={2}
                >
                  {t("transfer.receive.receiveConfirmation.addressVerified")}
                </Text>
              </Flex>
            ) : (
              <Flex>
                <TouchableOpacity onPress={onRetry}>
                  <Flex
                    alignItems="center"
                    justifyContent="center"
                    flexDirection="row"
                  >
                    <Icons.ShieldSecurityMedium
                      color="warning.c100"
                      size={16}
                    />
                    <Text
                      color="warning.c100"
                      fontWeight="medium"
                      variant="paragraphLineHeight"
                      ml={2}
                    >
                      {t("transfer.receive.receiveConfirmation.verifyAddress")}
                    </Text>
                  </Flex>
                </TouchableOpacity>
                <Text
                  variant="small"
                  fontWeight="medium"
                  color="neutral.c70"
                  textAlign="center"
                  mt={3}
                >
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
              <QRCode size={QRSize} value={mainAccount.freshAddress} ecl="H" />
            </Flex>
            <Flex
              alignItems="center"
              justifyContent="center"
              width={QRSize * 0.3}
              height={QRSize * 0.3}
              bg="constant.white"
              position="absolute"
            >
              <CurrencyIcon
                currency={currency}
                color={colors.constant.white}
                bg={
                  (currency as CryptoCurrency)?.color ||
                  (currency as TokenCurrency).parentCurrency?.color ||
                  colors.constant.black
                }
                size={48}
                circle
              />
            </Flex>
          </Flex>
          <Flex
            mt={10}
            bg={"neutral.c30"}
            borderRadius={8}
            p={6}
            mx={6}
            flexDirection="row"
            width="100%"
            justifyContent={"space-between"}
          >
            <Text numberOfLines={4} flex={1} fontWeight="semiBold">
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
          <Text
            variant="body"
            fontWeight="medium"
            color="neutral.c70"
            mt={6}
            mb={4}
            textAlign="center"
          >
            {t("transfer.receive.receiveConfirmation.sendWarning", {
              currencyName: currency.name,
              currencyTicker: currency.ticker,
            })}
          </Text>
          {mainAccount.operationsCount === 0 ? (
            <Alert
              type="warning"
              learnMoreUrl={urls.errors.TronSendTrc20ToNewAccountForbidden}
            >
              <Trans i18nKey="tron.receive.newAddressTRC20" />
            </Alert>
          ) : null}
        </Flex>
      </NavigationScrollView>
      <Flex m={6}>
        {isToastDisplayed ? (
          <Notification
            Icon={Icons.CircledCheckMedium}
            variant={"neutral"}
            title={t("transfer.receive.toastMessages.accountImported", {
              currencyTicker: currency.ticker,
            })}
            onClose={hideToast}
            linkText={t("transfer.receive.toastMessages.why")}
            onLinkPress={openAdditionalInfoModal}
          />
        ) : isVerifiedToastDisplayed ? (
          <Notification
            Icon={Icons.CircledCheckMedium}
            variant={"success"}
            title={t("transfer.receive.toastMessages.addressVerified")}
            onClose={hideVerifiedToast}
          />
        ) : (
          <Button type="shade" outline size="large" onPress={onShare}>
            {t("transfer.receive.shareAddress")}
          </Button>
        )}
      </Flex>
      {verified ? null : isModalOpened ? (
        <ReceiveSecurityModal onVerifyAddress={onRetry} />
      ) : null}

      <AdditionalInfoModal
        isOpen={isAddionalInfoModalOpen}
        onClose={closeAdditionalInfoModal}
        currencyTicker={currency.ticker}
      />
    </Flex>
  );
}
