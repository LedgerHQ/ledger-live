import React, { useCallback, useEffect, useState } from "react";
import { TouchableOpacity, Share } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import QRCode from "react-native-qrcode-svg";
import { useTranslation, Trans } from "react-i18next";
import type { Account, TokenAccount, AccountLike } from "@ledgerhq/types-live";
import {
  makeEmptyTokenAccount,
  getMainAccount,
  getAccountCurrency,
  getAccountName,
} from "@ledgerhq/live-common/account/index";
import { useTheme } from "styled-components/native";
import { Flex, Text, Icons, Button, Notification } from "@ledgerhq/native-ui";
import { useRoute } from "@react-navigation/native";
// eslint-disable-next-line import/no-unresolved
import { DeviceModelId } from "@ledgerhq/devices/lib/";
import { Currency } from "@ledgerhq/types-cryptoassets";
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
import PreventNativeBack from "../../components/PreventNativeBack";
import byFamily from "../../generated/Confirmation";

type Props = {
  account?: TokenAccount | Account;
  parentAccount?: Account;
  navigation: any;
  route: { params: RouteParams };
  readOnlyModeEnabled: boolean;
};

type RouteParams = {
  account?: AccountLike;
  accountId: string;
  parentId?: string;
  modelId: DeviceModelId;
  wired: boolean;
  device?: Device;
  currency?: Currency;
  createTokenAccount?: boolean;
  onSuccess?: (_?: string) => void;
  onError?: () => void;
};

export default function ReceiveConfirmation({ navigation }: Props) {
  const route = useRoute();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  return account ? (
    <ReceiveConfirmationInner
      navigation={navigation}
      route={route}
      account={account}
      parentAccount={parentAccount}
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
  const verified = route.params?.verified;
  const [isModalOpened, setIsModalOpened] = useState(true);
  const [hasAddedTokenAccount, setHasAddedTokenAccount] = useState();
  const [isToastDisplayed, setIsToastDisplayed] = useState(false);
  const [isVerifiedToastDisplayed, setIsVerifiedToastDisplayed] =
    useState(verified);
  const [isAddionalInfoModalOpen, setIsAddionalInfoModalOpen] = useState(false);
  const dispatch = useDispatch();

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

  useEffect(() => {
    if (route.params?.createTokenAccount && !hasAddedTokenAccount) {
      const newMainAccount = { ...mainAccount };
      if (
        !newMainAccount.subAccounts ||
        !newMainAccount.subAccounts.find(
          (acc: TokenAccount) => acc?.token?.id === currency.id,
        )
      ) {
        const emptyTokenAccount = makeEmptyTokenAccount(
          newMainAccount,
          currency,
        );
        newMainAccount.subAccounts = [
          ...(newMainAccount.subAccounts || []),
          emptyTokenAccount,
        ];

        // @TODO create a new action for adding a single account at a time instead of replacing
        dispatch(
          replaceAccounts({
            scannedAccounts: [newMainAccount],
            selectedIds: [newMainAccount.id],
            renamings: {},
          }),
        );
        setIsToastDisplayed(true);
        setHasAddedTokenAccount(true);
      }
    }
  }, [
    currency,
    route.params?.createTokenAccount,
    mainAccount,
    dispatch,
    hasAddedTokenAccount,
  ]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: getAccountName(account),
    });
  }, [colors, navigation, account]);

  useEffect(() => {
    setIsVerifiedToastDisplayed(verified);
    if (verified) {
      track("Verification Success", { currency: currency.name });
    }
  }, [verified, currency.name]);

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

  // check for coin specific UI
  const CustomConfirmation = byFamily[currency.family];
  if (CustomConfirmation)
    return <CustomConfirmation {...{ navigation, route }} />;

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
                  currency?.color ||
                  currency.parentCurrency?.color ||
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
            textAlign="center"
          >
            {t("transfer.receive.receiveConfirmation.sendWarning", {
              currencyName: currency.name,
              currencyTicker: currency.ticker,
            })}
          </Text>
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
