import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, Linking, Platform, Share, View } from "react-native";
import { useSelector, useDispatch } from "~/context/store";
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
import FeatureToggle from "@ledgerhq/live-common/featureFlags/FeatureToggle";
import { useTheme } from "styled-components/native";
import { Flex, Text, IconsLegacy, Button, Box, BannerCard, Icons } from "@ledgerhq/native-ui";
import { useRoute } from "@react-navigation/native";
import { hasMemoTag } from "LLM/features/MemoTag/utils/hasMemoTag";
import getWindowDimensions from "~/logic/getWindowDimensions";
import CurrencyIcon from "~/components/CurrencyIcon";
import NavigationScrollView from "~/components/NavigationScrollView";
import ReceiveSecurityModal from "./ReceiveSecurityModal";
import { addOneAccount } from "~/actions/accounts";
import { ScreenName } from "~/const";
import { track, TrackScreen } from "~/analytics";
import byFamily from "../../generated/Confirmation";
import byFamilyPostAlert from "../../generated/ReceiveConfirmationPostAlert";
import byFamilyTokenAlert from "../../generated/ReceiveConfirmationTokenAlert";
import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import styled, { BaseStyledProps } from "@ledgerhq/native-ui/components/styled";
import Clipboard from "@react-native-clipboard/clipboard";
import ConfirmationHeaderTitle from "./ConfirmationHeaderTitle";
import { BankMedium } from "@ledgerhq/native-ui/assets/icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hasClosedWithdrawBannerSelector } from "~/reducers/settings";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { setCloseWithdrawBanner } from "~/actions/settings";
import { urls } from "~/utils/urls";
import { useMaybeAccountName } from "~/reducers/wallet";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { isUTXOCompliant } from "@ledgerhq/live-common/currencies/helpers";
import { isAddressSanctioned } from "@ledgerhq/coin-framework/sanction/index";
import { NeedMemoTagModal } from "./NeedMemoTagModal";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import SanctionedAccountModal from "./SanctionedAccountModal";
import { useToastsActions } from "~/actions/toast";
import { getFreshAccountAddress } from "~/utils/address";
import { useOpenReceiveDrawer } from "LLM/features/Receive";

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
  const { account, parentAccount } = useAccountScreen(route);

  return account ? (
    <ReceiveConfirmationInner
      navigation={navigation}
      route={route}
      account={account}
      parentAccount={parentAccount ?? undefined}
    />
  ) : null;
}

function ReceiveConfirmationInner({ navigation, route, account, parentAccount }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const verified = route.params?.verified ?? false;
  const [isModalOpened, setIsModalOpened] = useState(true);
  const [hasAddedTokenAccount, setHasAddedTokenAccount] = useState(false);
  const [hasCopied, setCopied] = useState(false);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const withdrawCryptoUrl = useLocalizedUrl(urls.withdrawCrypto);
  const [isUserAddressSanctioned, setIsUserAddressSanctioned] = useState(false);

  const mainAccount = account && getMainAccount(account, parentAccount);
  const currency = route.params?.currency || (account && getAccountCurrency(account));
  const hasClosedWithdrawBanner = useSelector(hasClosedWithdrawBannerSelector);
  const [displayBanner, setDisplayBanner] = useState(!hasClosedWithdrawBanner);
  const { pushToast } = useToastsActions();

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    sourceScreenName: "receive_confirmation",
    currency: mainAccount?.currency,
    hideBackButton: false,
  });

  const onClose = useCallback(() => {
    if (mainAccount) {
      handleOpenReceiveDrawer();
    }
  }, [mainAccount, handleOpenReceiveDrawer]);

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
    setDisplayBanner(false);
  }, [dispatch]);

  const clickLearn = () => {
    track("button_clicked", {
      button: "How to withdraw from exchange",
      type: "card",
      page: "Receive Account Qr Code",
    });
    Linking.openURL(withdrawCryptoUrl);
  };

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

        dispatch(addOneAccount(newMainAccount as Account));
        setHasAddedTokenAccount(true);
      }
    }
  }, [currency, route.params?.createTokenAccount, mainAccount, dispatch, hasAddedTokenAccount]);

  useEffect(() => {
    navigation.setOptions({
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
  const freshAccountAddress = useMemo(() => {
    return mainAccount && getFreshAccountAddress(mainAccount);
  }, [mainAccount]);

  const onShare = useCallback(() => {
    track("button_clicked", {
      button: "Share address",
      page: "Receive Account Qr Code",
    });
    if (freshAccountAddress) {
      Share.share({ message: freshAccountAddress });
    }
  }, [freshAccountAddress]);

  const onCopyAddress = useCallback(
    (eventName: string) => {
      if (!freshAccountAddress) return;
      Clipboard.setString(freshAccountAddress);
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
    [freshAccountAddress, pushToast, t],
  );

  const mainAccountName = useMaybeAccountName(mainAccount);

  const screenHeight = Dimensions.get("window").height;
  const bannerHeight = useSharedValue(screenHeight * 0.23);
  const bannerOpacity = useSharedValue(1);

  const animatedBannerStyle = useAnimatedStyle(
    () => ({
      height: withTiming(bannerHeight.value, { duration: 200 }, onFinish => {
        if (onFinish && bannerHeight.value === 0) {
          runOnJS(hideBanner)();
        }
      }),
      opacity: withTiming(bannerOpacity.value, { duration: 200 }),
    }),
    [bannerHeight, bannerOpacity, hideBanner],
  );

  const handleBannerClose = useCallback(() => {
    bannerHeight.value = 0;
    bannerOpacity.value = 0;
  }, [bannerHeight, bannerOpacity]);

  useEffect(() => {
    const checkUserAddressSanctioned = async () => {
      const mainAccount = account && getMainAccount(account, parentAccount);
      if (mainAccount && freshAccountAddress) {
        setIsUserAddressSanctioned(
          await isAddressSanctioned(mainAccount.currency, freshAccountAddress),
        );
      }
    };

    checkUserAddressSanctioned();
  }, [account, parentAccount, freshAccountAddress]);

  if (!account || !currency || !mainAccount) return null;

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

  let CustomConfirmationTokenAlert;
  if (
    currency.type === "TokenCurrency" &&
    Object.keys(byFamilyTokenAlert).includes(currency.parentCurrency.family)
  ) {
    CustomConfirmationTokenAlert =
      byFamilyTokenAlert[currency.parentCurrency.family as keyof typeof byFamilyTokenAlert];
  }

  const isAnAccount = account.type === "Account";
  const isUTXOCompliantCurrency = isAnAccount && isUTXOCompliant(account.currency.family);

  return (
    <Flex flex={1}>
      <NavigationScrollView
        testID="receive-screen-scrollView"
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <TrackScreen
          category="Deposit"
          name="Receive Account Qr Code"
          asset={currency.name}
          network={network}
        />
        <Flex p={0} alignItems="center" justifyContent="center">
          <StyledTouchableHightlight
            activeOpacity={1}
            underlayColor={colors.opacityDefault.c10}
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
                  testID={"receive-account-name-" + mainAccountName}
                >
                  {mainAccountName}
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
                testID={"receive-qr-code-container-" + mainAccountName}
              >
                <QRCode size={QRSize} value={freshAccountAddress} ecl="H" />
                <Flex
                  alignItems="center"
                  justifyContent="center"
                  width={QRSize * 0.3}
                  height={QRSize * 0.3}
                  bg="constant.white"
                  position="absolute"
                >
                  <CurrencyIcon currency={currency} size={48} />
                </Flex>
              </Flex>
              <Text
                testID="receive-fresh-address"
                variant={"body"}
                fontWeight={"medium"}
                textAlign={"center"}
                mt={6}
              >
                {freshAccountAddress}
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
              {Platform.OS === "android" ? <Icons.ShareAlt /> : <Icons.Share />}
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
          <FeatureToggle featureId="llmMemoTag">
            {hasMemoTag(currency) && <NeedMemoTagModal />}
          </FeatureToggle>
          <Flex px={6} flexDirection="column" rowGap={8} mt={6}>
            {isUTXOCompliantCurrency && (
              <Text variant="small" fontWeight="medium" color="neutral.c70" textAlign="center">
                {t("transfer.receive.receiveConfirmation.utxoWarning")}
              </Text>
            )}
            <Text variant="small" fontWeight="medium" color="neutral.c70" mb={4} textAlign="center">
              {t("transfer.receive.receiveConfirmation.sendWarning", {
                network: network || currency.name,
              })}
            </Text>
          </Flex>
          {CustomConfirmationAlert && <CustomConfirmationAlert mainAccount={mainAccount} />}
          {CustomConfirmationTokenAlert && currency.type === "TokenCurrency" && (
            <CustomConfirmationTokenAlert
              account={account}
              mainAccount={mainAccount}
              token={currency}
            />
          )}
        </Flex>
      </NavigationScrollView>
      {displayBanner && (
        <Animated.View style={[animatedBannerStyle, { marginHorizontal: 16, marginTop: 16 }]}>
          <WithdrawBanner hideBanner={handleBannerClose} onPress={clickLearn} />
        </Animated.View>
      )}
      <Flex
        px={6}
        mt={6}
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        backgroundColor="background.main"
        paddingBottom={insets.bottom}
      >
        <Flex>
          <Button type="main" size="large" onPress={onRetry} testID="button-receive-confirmation">
            {t("transfer.receive.receiveConfirmation.verifyAddress")}
          </Button>
        </Flex>
      </Flex>
      {isUserAddressSanctioned ? (
        <SanctionedAccountModal
          userAddress={account.type === "Account" ? getFreshAccountAddress(account) : ""}
          onClose={onClose}
        />
      ) : verified ? null : isModalOpened ? (
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
  return (
    <BannerCard
      typeOfRightIcon="close"
      title={t("transfer.receive.receiveConfirmation.bannerTitle")}
      LeftElement={<BankMedium size={20} />}
      onPressDismiss={hideBanner}
      onPress={onPress}
    />
  );
};
