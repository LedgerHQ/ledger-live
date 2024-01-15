import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Share, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import QRCode from "react-native-qrcode-svg";
import { useTranslation } from "react-i18next";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  makeEmptyTokenAccount,
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/color";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { useTheme } from "styled-components/native";
import { Flex, Text, IconsLegacy, Button, Box, BannerCard, Icons } from "@ledgerhq/native-ui";
import { useRoute } from "@react-navigation/native";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { accountScreenSelector } from "~/reducers/accounts";
import CurrencyIcon from "~/components/CurrencyIcon";
import NavigationScrollView from "~/components/NavigationScrollView";
import ReceiveSecurityModal from "./ReceiveSecurityModal";
import { replaceAccounts } from "~/actions/accounts";
import { ScreenName } from "~/const";
import { track, TrackScreen } from "~/analytics";
import byFamily from "../../generated/Confirmation";
import byFamilyPostAlert from "../../generated/ReceiveConfirmationPostAlert";

import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import styled, { BaseStyledProps } from "@ledgerhq/native-ui/components/styled";
import Clipboard from "@react-native-clipboard/clipboard";
import ConfirmationHeaderTitle from "./ConfirmationHeaderTitle";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { BankMedium } from "@ledgerhq/native-ui/assets/icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hasClosedWithdrawBannerSelector } from "~/reducers/settings";
import { setCloseWithdrawBanner } from "~/actions/settings";
import * as Animatable from "react-native-animatable";

const AnimatedView = Animatable.View;

type ScreenProps = BaseComposite<
  StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.ReceiveConfirmation>
>;

type Props = {
  account?: TokenAccount | Account;
  parentAccount?: Account;
  readOnlyModeEnabled?: boolean;
} & ScreenProps;

const StyledTouchableHightlight = styled.TouchableHighlight<BaseStyledProps>``;
const StyledTouchableOpacity = styled.TouchableOpacity<BaseStyledProps>``;

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

function ReceiveConfirmationInner({ navigation, route, account, parentAccount }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { pushToast } = useToasts();
  const verified = route.params?.verified ?? false;
  const [isModalOpened, setIsModalOpened] = useState(true);
  const [hasAddedTokenAccount, setHasAddedTokenAccount] = useState(false);
  const [hasCopied, setCopied] = useState(false);
  const dispatch = useDispatch();
  const depositWithdrawBannerMobile = useFeature("depositWithdrawBannerMobile");
  const insets = useSafeAreaInsets();

  const hasClosedWithdrawBanner = useSelector(hasClosedWithdrawBannerSelector);
  const [displayBanner, setBanner] = useState(!hasClosedWithdrawBanner);

  const onRetry = useCallback(() => {
    track("button_clicked", {
      button: "Verify address",
      page: "Receive Account Qr Code",
    });
    const params = { ...route.params, notSkippable: true };
    setIsModalOpened(false);
    navigation.navigate(ScreenName.ReceiveConnectDevice, params);
  }, [navigation, route.params]);

  const { width } = getWindowDimensions();
  const QRSize = Math.round(width / 1.8 - 16);
  const QRContainerSize = QRSize + 16 * 4;

  const mainAccount = account && getMainAccount(account, parentAccount);
  const currency = route.params?.currency || (account && getAccountCurrency(account));

  const network = useMemo(() => {
    if (currency && currency.type === "TokenCurrency") {
      return currency.parentCurrency?.name;
    }
  }, [currency]);

  const hideBanner = useCallback(() => {
    track("button_clicked", {
      button: "How to withdraw from exchange",
      page: "Receive Account Qr Code",
    });
    dispatch(setCloseWithdrawBanner(true));
    setBanner(false);
  }, [dispatch]);

  const clickLearn = useCallback(() => {
    track("button_clicked", {
      button: "How to withdraw from exchange",
      type: "card",
      page: "Receive Account Qr Code",
    });
    // @ts-expect-error TYPINGS
    Linking.openURL(depositWithdrawBannerMobile?.params?.url);
  }, [depositWithdrawBannerMobile?.params?.url]);

  useEffect(() => {
    if (route.params?.createTokenAccount && !hasAddedTokenAccount) {
      const newMainAccount = { ...mainAccount };
      if (
        !newMainAccount.subAccounts ||
        !newMainAccount.subAccounts.find(
          acc => (acc as TokenAccount)?.token?.id === (currency as CryptoOrTokenCurrency).id,
        )
      ) {
        const emptyTokenAccount = makeEmptyTokenAccount(
          newMainAccount as Account,
          currency as TokenCurrency,
        );
        newMainAccount.subAccounts = [...(newMainAccount.subAccounts || []), emptyTokenAccount];

        // @TODO create a new action for adding a single account at a time instead of replacing
        dispatch(
          replaceAccounts({
            scannedAccounts: [newMainAccount as Account],
            selectedIds: [(newMainAccount as Account).id],
            renamings: {},
          }),
        );
        setHasAddedTokenAccount(true);
      }
    }
  }, [currency, route.params?.createTokenAccount, mainAccount, dispatch, hasAddedTokenAccount]);

  useEffect(() => {
    navigation.setOptions({
      //headerTitle: getAccountName(account as AccountLike),
      headerTitle: () => (
        <ConfirmationHeaderTitle accountCurrency={currency}></ConfirmationHeaderTitle>
      ),
    });
  }, [colors, navigation, account, currency]);

  useEffect(() => {
    if (verified && currency) {
      track("Verification Success", {
        asset: currency.name,
        page: "Receive Account Qr Code",
      });
    }
  }, [verified, currency]);

  const triggerSuccessEvent = useCallback(() => {
    track("receive_done", {
      asset: currency?.name,
      network,
      page: "Receive Account Qr Code",
    });
  }, [network, currency?.name]);

  useEffect(() => {
    if (verified || !isModalOpened) {
      triggerSuccessEvent();
    }
  }, [verified, isModalOpened, triggerSuccessEvent]);

  const onShare = useCallback(() => {
    track("button_clicked", {
      button: "Share address",
      page: "Receive Account Qr Code",
    });
    if (mainAccount?.freshAddress) {
      Share.share({ message: mainAccount?.freshAddress });
    }
  }, [mainAccount?.freshAddress]);

  const onCopyAddress = useCallback(
    (eventName: string) => {
      if (!mainAccount?.freshAddress) return;
      Clipboard.setString(mainAccount.freshAddress);
      setCopied(true);
      track("button_clicked", {
        button: eventName,
        page: "Receive Account Qr Code",
      });
      const options = {
        enableVibrateFallback: false,
        ignoreAndroidSystemSettings: false,
      };

      setTimeout(() => {
        setCopied(false);
      }, 3000);

      ReactNativeHapticFeedback.trigger("soft", options);
      pushToast({
        id: `copy-receive`,
        type: "success",
        icon: "success",
        title: t("transfer.receive.addressCopied"),
      });
    },
    [mainAccount?.freshAddress, pushToast, t],
  );

  if (!account || !currency || !mainAccount) return null;

  // check for coin specific UI
  if (currency.type === "CryptoCurrency" && Object.keys(byFamily).includes(currency.family)) {
    const CustomConfirmation =
      currency.type === "CryptoCurrency"
        ? byFamily[currency.family as keyof typeof byFamily]
        : null;
    if (CustomConfirmation) {
      return (
        <CustomConfirmation
          account={mainAccount || account}
          parentAccount={mainAccount}
          {...{ navigation, route }}
        />
      );
    }
  }

  let CustomConfirmationAlert;
  if (
    currency.type === "CryptoCurrency" &&
    Object.keys(byFamilyPostAlert).includes(currency.family)
  ) {
    CustomConfirmationAlert =
      currency.type === "CryptoCurrency"
        ? byFamilyPostAlert[currency.family as keyof typeof byFamilyPostAlert]
        : null;
  }

  return (
    <Flex flex={1} mb={insets.bottom}>
      <NavigationScrollView style={{ flex: 1 }}>
        <TrackScreen
          category="Deposit"
          name="Receive Account Qr Code"
          asset={currency.name}
          network={network}
        />
        <Flex p={0} alignItems="center" justifyContent="center">
          <StyledTouchableHightlight
            activeOpacity={1}
            underlayColor={colors.palette.opacityDefault.c10}
            alignItems="center"
            justifyContent="center"
            width={QRContainerSize}
            p={6}
            mt={10}
            bg={"opacityDefault.c05"}
            borderRadius={2}
            onPress={() => onCopyAddress("Qr code copy address")}
          >
            <View>
              <Box mb={6}>
                <Text
                  variant={"body"}
                  fontWeight={"semiBold"}
                  textAlign={"center"}
                  numberOfLines={1}
                  testID={"receive-account-name-" + mainAccount.name}
                >
                  {mainAccount.name}
                </Text>
              </Box>
              <Flex
                p={6}
                borderRadius={24}
                position="relative"
                bg="constant.white"
                borderWidth={1}
                borderColor="neutral.c40"
                alignItems="center"
                justifyContent="center"
              >
                <QRCode size={QRSize} value={mainAccount.freshAddress} ecl="H" />
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
                    bg={getCurrencyColor(currency) || colors.constant.black}
                    size={48}
                    circle
                  />
                </Flex>
              </Flex>
              <Text
                testID="receive-fresh-address"
                variant={"body"}
                fontWeight={"medium"}
                textAlign={"center"}
                mt={6}
              >
                {mainAccount.freshAddress}
              </Text>
            </View>
          </StyledTouchableHightlight>
          <Flex width={QRContainerSize} flexDirection="row" mt={6}>
            <StyledTouchableOpacity
              p={4}
              bg={"opacityDefault.c05"}
              borderRadius={2}
              mr={4}
              onPress={onShare}
            >
              <IconsLegacy.ShareMedium size={20} />
            </StyledTouchableOpacity>
            <StyledTouchableOpacity
              p={4}
              bg={"opacityDefault.c05"}
              justifyContent={"center"}
              alignItems={"center"}
              flexDirection="row"
              flex={1}
              borderRadius={2}
              onPress={() => onCopyAddress("Copy address")}
            >
              {hasCopied ? (
                <>
                  <Icons.Check color="success.c70" size="S" />
                  <Text variant={"body"} fontWeight={"medium"} pl={3}>
                    {t("transfer.receive.receiveConfirmation.addressCopied")}
                  </Text>
                </>
              ) : (
                <>
                  <IconsLegacy.CopyMedium size={20} />
                  <Text variant={"body"} fontWeight={"medium"} pl={3}>
                    {t("transfer.receive.receiveConfirmation.copyAdress")}
                  </Text>
                </>
              )}
            </StyledTouchableOpacity>
          </Flex>
          <Flex px={6}>
            <Text
              variant="small"
              fontWeight="medium"
              color="neutral.c70"
              mt={6}
              mb={4}
              textAlign="center"
            >
              {t("transfer.receive.receiveConfirmation.sendWarning", {
                network: network || currency.name,
              })}
            </Text>
          </Flex>
          {CustomConfirmationAlert && <CustomConfirmationAlert mainAccount={mainAccount} />}
        </Flex>
      </NavigationScrollView>
      <Flex m={6}>
        <Flex>
          <Button type="main" size="large" onPress={onRetry} testID="button-receive-confirmation">
            {t("transfer.receive.receiveConfirmation.verifyAddress")}
          </Button>

          {depositWithdrawBannerMobile?.enabled ? (
            displayBanner ? (
              <AnimatedView animation="fadeInUp" delay={50} duration={300}>
                <WithdrawBanner hideBanner={hideBanner} onPress={clickLearn} />
              </AnimatedView>
            ) : (
              <AnimatedView animation="fadeOutDown" delay={50} duration={300}>
                <WithdrawBanner hideBanner={hideBanner} onPress={clickLearn} />
              </AnimatedView>
            )
          ) : null}
        </Flex>
      </Flex>
      {verified ? null : isModalOpened ? (
        <ReceiveSecurityModal onVerifyAddress={onRetry} triggerSuccessEvent={triggerSuccessEvent} />
      ) : null}
    </Flex>
  );
}

type BannerProps = {
  hideBanner: () => void;
  onPress: () => void;
};

const WithdrawBanner = ({ onPress, hideBanner }: BannerProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Flex pb={insets.bottom} mt={6}>
      <BannerCard
        typeOfRightIcon="close"
        title={t("transfer.receive.receiveConfirmation.bannerTitle")}
        LeftElement={<BankMedium />}
        onPressDismiss={hideBanner}
        onPress={onPress}
      />
    </Flex>
  );
};
