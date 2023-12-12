import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import styled from "styled-components/native";
import {
  BluetoothRequired,
  LockedDeviceError,
  PeerRemovedPairing,
  WrongDeviceForAccount,
} from "@ledgerhq/errors";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppRequest } from "@ledgerhq/live-common/hw/actions/app";
import firmwareUpdateRepair from "@ledgerhq/live-common/hw/firmwareUpdate-repair";
import { getProviderName, getNoticeType } from "@ledgerhq/live-common/exchange/swap/utils/index";
import {
  InfiniteLoader,
  Text,
  Flex,
  Tag,
  IconsLegacy,
  BoxedIcon,
  Log,
  Icons,
} from "@ledgerhq/native-ui";
import { DownloadMedium } from "@ledgerhq/native-ui/assets/icons";
import BigNumber from "bignumber.js";
import { ExchangeRate, Exchange } from "@ledgerhq/live-common/exchange/swap/types";
import {
  getAccountUnit,
  getMainAccount,
  getAccountName,
  getAccountCurrency,
  getFeesCurrency,
  getFeesUnit,
} from "@ledgerhq/live-common/account/index";
import { TFunction } from "react-i18next";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeviceModelInfo } from "@ledgerhq/types-live";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";
import isFirmwareUpdateVersionSupported from "@ledgerhq/live-common/hw/isFirmwareUpdateVersionSupported";
import ProviderIcon from "../ProviderIcon";
import { lastSeenDeviceSelector } from "~/reducers/settings";
import { urls } from "~/utils/urls";
import Alert from "../Alert";
import { lighten, Theme } from "../../colors";
import Button from "../Button";
import DeviceActionProgress from "../DeviceActionProgress";
import { NavigatorName, ScreenName } from "~/const";
import Animation from "../Animation";
import { getDeviceAnimation } from "~/helpers/getDeviceAnimation";
import GenericErrorView from "../GenericErrorView";
import Circle from "../Circle";
import { MANAGER_TABS } from "~/const/manager";
import ExternalLink from "../ExternalLink";
import { TrackScreen, track } from "~/analytics";
import CurrencyUnitValue from "../CurrencyUnitValue";
import TermsFooter, { TermsProviders } from "../TermsFooter";
import CurrencyIcon from "../CurrencyIcon";
import { StaxFramedImageWithContext, transferConfig } from "../CustomImage/StaxFramedImage";
import {
  Props as FramedImageWithLottieProps,
  StaxFramedLottieWithContext,
} from "../CustomImage/StaxFramedLottie";
import ModalLock from "../ModalLock";
import confirmLockscreen from "~/animations/stax/customimage/confirmLockscreen.json";
import allowConnection from "~/animations/stax/customimage/allowConnection.json";
import Config from "react-native-config";

export const Wrapper = styled(Flex).attrs({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  minHeight: "160px",
})``;

const AnimationContainer = styled(Flex).attrs({
  alignSelf: "stretch",
  alignItems: "center",
  justifyContent: "center",
  height: "150px",
})``;

const ActionContainer = styled(Flex).attrs({
  alignSelf: "stretch",
  mt: 6,
})``;

const SpinnerContainer = styled(Flex).attrs({
  padding: 24,
})``;

const IconContainer = styled(Flex).attrs({
  margin: 6,
})``;

const CenteredText = styled(Text).attrs({
  fontWeight: "medium",
  textAlign: "center",
})``;

export const TitleText = ({ children }: { children: React.ReactNode }) => (
  <Flex>
    <Text textAlign="center" variant="h4" fontWeight="semiBold">
      {children}
    </Text>
  </Flex>
);

const DescriptionText = styled(CenteredText).attrs({
  variant: "bodyLineHeight",
  py: "8px",
  fontWeight: "medium",
  color: "neutral.c70",
})``;

const ConnectDeviceNameText = styled(Tag).attrs({
  my: "8",
  uppercase: false,
})``;

const StyledButton = styled(Button).attrs({
  mt: 6,
  alignSelf: "stretch",
})``;

const ConnectDeviceExtraContentWrapper = styled(Flex).attrs({
  mb: 8,
})``;

const animationStyles = (modelId: DeviceModelId) =>
  modelId === DeviceModelId.stax ? { height: 210 } : {};

type RawProps = {
  t: (key: string, options?: { [key: string]: string | number }) => string;
  colors?: Theme["colors"];
  theme?: "light" | "dark";
};

export function renderRequestQuitApp({
  t,
  device,
  theme,
}: RawProps & {
  device: Device;
}) {
  return (
    <Wrapper>
      <AnimationContainer>
        <Animation
          source={getDeviceAnimation({ device, key: "quitApp", theme })}
          style={animationStyles(device.modelId)}
        />
      </AnimationContainer>
      <CenteredText>{t("DeviceAction.quitApp")}</CenteredText>
    </Wrapper>
  );
}

export function renderRequiresAppInstallation({
  t,
  navigation,
  appNames,
}: RawProps & {
  navigation: StackNavigationProp<ParamListBase>;
  appNames: string[];
}) {
  const appNamesCSV = appNames.join(", ");

  return (
    <Wrapper>
      <CenteredText>
        {t("DeviceAction.appNotInstalled", {
          appName: appNamesCSV,
          count: appNames.length,
        })}
      </CenteredText>
      <ActionContainer>
        <StyledButton
          event="DeviceActionRequiresAppInstallationOpenManager"
          type="primary"
          title={t("DeviceAction.button.openManager")}
          onPress={() =>
            navigation.navigate(NavigatorName.Manager, {
              screen: ScreenName.Manager,
              params: { searchQuery: appNamesCSV },
            })
          }
        />
      </ActionContainer>
    </Wrapper>
  );
}

export function renderVerifyAddress({
  t,
  device,
  currencyName,
  onPress,
  address,
  theme,
}: RawProps & {
  device: Device;
  currencyName: string;
  onPress?: () => void;
  address?: string;
}) {
  return (
    <Wrapper>
      <AnimationContainer>
        <Animation
          source={getDeviceAnimation({ device, key: "verify", theme })}
          style={animationStyles(device.modelId)}
        />
      </AnimationContainer>
      <TitleText>{t("DeviceAction.verifyAddress.title")}</TitleText>
      <DescriptionText>
        {t("DeviceAction.verifyAddress.description", { currencyName })}
      </DescriptionText>
      <ActionContainer>
        {onPress && (
          <StyledButton
            event="DeviceActionVerifyAddress"
            type="primary"
            title={t("common.continue")}
            onPress={onPress}
          />
        )}
        {address && (
          <Flex py={8}>
            <Log extraTextProps={{ textTransform: "none" }}>{address}</Log>
          </Flex>
        )}
      </ActionContainer>
    </Wrapper>
  );
}

export function renderConfirmSwap({
  t,
  device,
  theme,
  transaction,
  exchangeRate,
  exchange,
  amountExpectedTo,
  estimatedFees,
}: RawProps & {
  device: Device;
  transaction: Transaction;
  exchangeRate: ExchangeRate;
  exchange: Exchange;
  amountExpectedTo?: string | null;
  estimatedFees?: string | null;
}) {
  const providerName = getProviderName(exchangeRate.provider);
  const noticeType = getNoticeType(exchangeRate.provider);
  const alertProperties = noticeType.learnMore ? { learnMoreUrl: urls.swap.learnMore } : {};
  return (
    <ScrollView>
      <Wrapper width="100%">
        <Alert type="primary" {...alertProperties}>
          {t(`DeviceAction.confirmSwap.alert.${noticeType.message}`, {
            providerName,
          })}
        </Alert>
        <AnimationContainer marginTop="16px">
          <Animation
            source={getDeviceAnimation({ device, key: "sign", theme })}
            style={animationStyles(device.modelId)}
          />
        </AnimationContainer>
        <TitleText>{t("DeviceAction.confirmSwap.title")}</TitleText>

        <Flex justifyContent={"space-between"} width="100%">
          <FieldItem title={t("DeviceAction.swap2.amountSent")}>
            <Text>
              <CurrencyUnitValue
                value={transaction.amount}
                unit={getAccountUnit(exchange.fromAccount)}
                disableRounding
                showCode
              />
            </Text>
          </FieldItem>

          <FieldItem title={t("DeviceAction.swap2.amountReceived")}>
            <Text>
              <CurrencyUnitValue
                unit={getAccountUnit(exchange.toAccount)}
                value={amountExpectedTo ? new BigNumber(amountExpectedTo) : exchangeRate.toAmount}
                disableRounding
                showCode
              />
            </Text>
          </FieldItem>

          <FieldItem title={t("DeviceAction.swap2.provider")}>
            <Flex flexDirection="row" alignItems="center">
              <Flex paddingRight={2}>
                <ProviderIcon size="XXS" name={exchangeRate.provider} />
              </Flex>

              <Text>{providerName}</Text>
            </Flex>
          </FieldItem>

          <FieldItem title={t("DeviceAction.swap2.fees")}>
            <Text>
              <CurrencyUnitValue
                unit={getFeesUnit(
                  getFeesCurrency(getMainAccount(exchange.fromAccount, exchange.fromParentAccount)),
                )}
                value={new BigNumber(estimatedFees || 0)}
                disableRounding
                showCode
              />
            </Text>
          </FieldItem>

          <FieldItem title={t("DeviceAction.swap2.sourceAccount")}>
            <Flex flexDirection="row" alignItems="center">
              <CurrencyIcon size={20} currency={getAccountCurrency(exchange.fromAccount)} />
              <Text marginLeft={2}>{getAccountName(exchange.fromAccount)}</Text>
            </Flex>
          </FieldItem>

          <FieldItem title={t("DeviceAction.swap2.targetAccount")}>
            <Flex flexDirection="row" alignItems="center">
              <CurrencyIcon size={20} currency={getAccountCurrency(exchange.toAccount)} />
              <Text marginLeft={2}>{getAccountName(exchange.toAccount)}</Text>
            </Flex>
          </FieldItem>
        </Flex>

        <TermsFooter provider={exchangeRate.provider as TermsProviders} />
      </Wrapper>
    </ScrollView>
  );
}

function FieldItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Flex flexDirection="row" justifyContent="space-between" paddingY={4}>
      <Text color="neutral.c70">{title}</Text>

      <Flex flexDirection="row" alignItems="center">
        {children}
      </Flex>
    </Flex>
  );
}

export function renderAllowManager({
  t,
  device,
  theme,
  requestType = "manager",
}: RawProps & {
  device: Device;
  requestType?: "manager" | "rename";
}) {
  // TODO: disable gesture, modal close, hide header buttons
  return (
    <Wrapper pb={6} pt={6}>
      <Flex>
        <Text fontWeight="semiBold" fontSize={24} textAlign="center" mb={10}>
          {t(
            requestType === "rename"
              ? "DeviceAction.allowRenaming"
              : "DeviceAction.allowManagerPermission",
            {
              productName: getDeviceModel(device.modelId)?.productName,
            },
          )}
        </Text>
      </Flex>
      <AnimationContainer>
        <Animation
          source={getDeviceAnimation({ device, key: "allowManager", theme })}
          style={animationStyles(device.modelId)}
        />
      </AnimationContainer>
    </Wrapper>
  );
}

export function renderAllowLanguageInstallation({
  t,
  device,
  theme,
  fullScreen = true,
  wording,
}: RawProps & {
  device: Device;
  fullScreen?: boolean;
  wording?: string;
}) {
  const deviceName = getDeviceModel(device.modelId).productName;
  const key = device.modelId === "stax" ? "allowManager" : "sign";

  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      alignSelf="stretch"
      flex={fullScreen ? 1 : undefined}
    >
      <TrackScreen category="Allow language installation on device" refreshSource={false} />
      <Text variant="h4" textAlign="center">
        {wording ??
          t("deviceLocalization.allowLanguageInstallation", {
            deviceName,
          })}
      </Text>
      <AnimationContainer my={8}>
        <Animation
          source={getDeviceAnimation({ device, key, theme })}
          style={animationStyles(device.modelId)}
        />
      </AnimationContainer>
    </Flex>
  );
}

export const renderAllowRemoveCustomLockscreen = ({
  t,
  device,
  theme,
}: RawProps & {
  device: Device;
}) => {
  const productName = getDeviceModel(device.modelId).productName;
  const key = device.modelId === "stax" ? "allowManager" : "sign";

  return (
    <Wrapper>
      <TrackScreen category={`Allow CLS removal on ${productName}`} />
      <Text variant="h4" textAlign="center">
        {t("DeviceAction.allowRemoveCustomLockscreen", { productName })}
      </Text>
      <AnimationContainer>
        <Animation
          source={getDeviceAnimation({ device, key, theme })}
          style={animationStyles(device.modelId)}
        />
      </AnimationContainer>
    </Wrapper>
  );
};

const AllowOpeningApp = ({
  t,
  navigation,
  wording,
  tokenContext,
  isDeviceBlocker,
  device,
  theme,
}: RawProps & {
  navigation: StackNavigationProp<ParamListBase>;
  wording: string;
  tokenContext?: TokenCurrency | null | undefined;
  isDeviceBlocker?: boolean;
  device: Device;
}) => {
  useEffect(() => {
    if (isDeviceBlocker) {
      // TODO: disable gesture, modal close, hide header buttons
      navigation.setOptions({
        gestureEnabled: false,
      });
    }
  }, [isDeviceBlocker, navigation]);

  return (
    <Wrapper>
      <AnimationContainer>
        <Animation
          source={getDeviceAnimation({
            device,
            key: "openApp",
            theme,
          })}
          style={animationStyles(device.modelId)}
        />
      </AnimationContainer>
      <TitleText>{t("DeviceAction.allowAppPermission", { wording })}</TitleText>
      {tokenContext ? (
        <CenteredText>
          {t("DeviceAction.allowAppPermissionSubtitleToken", {
            token: tokenContext.name,
          })}
        </CenteredText>
      ) : null}
      <ModalLock />
    </Wrapper>
  );
};

export function renderAllowOpeningApp({
  t,
  navigation,
  wording,
  tokenContext,
  isDeviceBlocker,
  device,
  theme,
}: RawProps & {
  navigation: StackNavigationProp<ParamListBase>;
  wording: string;
  tokenContext?: TokenCurrency | undefined | null;
  isDeviceBlocker?: boolean;
  device: Device;
}) {
  return (
    <AllowOpeningApp
      t={t}
      navigation={navigation}
      wording={wording}
      tokenContext={tokenContext}
      isDeviceBlocker={isDeviceBlocker}
      device={device}
      theme={theme}
    />
  );
}

export function renderInWrongAppForAccount({
  t,
  onRetry,
  colors,
  theme,
}: RawProps & {
  onRetry?: (() => void) | null;
}) {
  return renderError({
    t,
    error: new WrongDeviceForAccount(),
    onRetry,
    colors,
    theme,
  });
}

// Quick fix: the error LockedDeviceError should be catched
// inside all the device actions and mapped to an event of type "lockedDevice".
// With this fix, we can catch all the device action error that were not catched upstream.
// If LockedDeviceError is thrown from outside a device action and renderError was not called
// it is still handled by GenericErrorView.
export function renderLockedDeviceError({
  t,
  onRetry,
  device,
}: RawProps & {
  onRetry?: (() => void) | null;
  device?: Device;
}) {
  const productName = device ? getDeviceModel(device.modelId).productName : null;

  return (
    <Wrapper>
      <Flex flexDirection="column" alignItems="center" alignSelf="stretch">
        <Flex mb={7}>
          <BoxedIcon
            Icon={Icons.InformationFill}
            backgroundColor={"opacityDefault.c05"}
            size={64}
            variant="circle"
            borderColor="transparent"
            iconSize={"L"}
            iconColor="primary.c80"
          />
        </Flex>

        <Text variant="h4" fontWeight="semiBold" textAlign="center" numberOfLines={3} mb={6}>
          {t("errors.LockedDeviceError.title")}
        </Text>
        <Text variant="paragraph" textAlign="center" numberOfLines={3} mb={6}>
          {productName
            ? t("errors.LockedDeviceError.descriptionWithProductName", {
                productName,
              })
            : t("errors.LockedDeviceError.description")}
        </Text>
        {onRetry ? (
          <ActionContainer marginBottom={0} marginTop={32}>
            <StyledButton
              event="DeviceActionErrorRetry"
              type="main"
              outline={false}
              title={t("common.retry")}
              onPress={onRetry}
            />
          </ActionContainer>
        ) : null}
      </Flex>
    </Wrapper>
  );
}

export function renderError({
  t,
  error,
  onRetry,
  managerAppName,
  navigation,
  Icon,
  iconColor,
  device,
  hasExportLogButton,
}: RawProps & {
  navigation?: StackNavigationProp<ParamListBase>;
  error: Error;
  onRetry?: (() => void) | null;
  managerAppName?: string;
  Icon?: React.ComponentProps<typeof GenericErrorView>["Icon"];
  iconColor?: string;
  device?: Device;
  hasExportLogButton?: boolean;
}) {
  const onPress = () => {
    if (managerAppName && navigation) {
      navigation.navigate(NavigatorName.Manager, {
        screen: ScreenName.Manager,
        params: {
          tab: MANAGER_TABS.INSTALLED_APPS,
          updateModalOpened: true,
        },
      });
    } else if (onRetry) {
      onRetry();
    }
  };

  // Redirects from renderError and not from DeviceActionDefaultRendering because renderError
  // can be used directly by other component
  if (error instanceof LockedDeviceError) {
    return renderLockedDeviceError({ t, onRetry, device });
  }

  // TODO Once we have the aligned Error renderings, the CTA list should be determined
  // by the error class, not patched like here.
  let showRetryIfAvailable = true;
  if ((error as unknown) instanceof PeerRemovedPairing) {
    showRetryIfAvailable = false;
  }

  return (
    <Wrapper>
      <GenericErrorView
        error={error}
        withDescription
        Icon={Icon}
        iconColor={iconColor}
        hasExportLogButton={hasExportLogButton}
      >
        {showRetryIfAvailable && (onRetry || managerAppName) ? (
          <Flex
            alignSelf="stretch"
            mb={0}
            mt={(error as unknown as Error) instanceof BluetoothRequired ? 0 : 8}
          >
            <StyledButton
              event="DeviceActionErrorRetry"
              type="main"
              size="large"
              outline={false}
              title={managerAppName ? t("DeviceAction.button.openManager") : t("common.retry")}
              onPress={onPress}
            />
          </Flex>
        ) : null}
      </GenericErrorView>
    </Wrapper>
  );
}

export function RequiredFirmwareUpdate({
  t,
  device,
  navigation,
}: RawProps & {
  navigation: StackNavigationProp<ParamListBase>;
  device: Device;
}) {
  const lastSeenDevice: DeviceModelInfo | null | undefined = useSelector(lastSeenDeviceSelector);

  const isUsbFwVersionUpdateSupported =
    lastSeenDevice && isFirmwareUpdateVersionSupported(lastSeenDevice.deviceInfo, device.modelId);

  const usbFwUpdateActivated = Platform.OS === "android" && isUsbFwVersionUpdateSupported;

  const deviceName = getDeviceModel(device.modelId).productName;

  const isDeviceConnectedViaUSB = device.wired;

  // Goes to the manager if a firmware update is available, but only automatically
  // displays the firmware update drawer if the device is already connected via USB
  const onPress = () => {
    navigation.navigate(NavigatorName.Manager, {
      screen: ScreenName.Manager,
      params: { device, firmwareUpdate: isDeviceConnectedViaUSB },
    });
  };

  return (
    <Wrapper>
      <Flex flexDirection="column" alignItems="center" alignSelf="stretch">
        <Flex mb={5}>
          <BoxedIcon size={64} Icon={DownloadMedium} iconSize={24} iconColor="neutral.c100" />
        </Flex>

        <Text variant="h4" fontWeight="semiBold" textAlign="center" numberOfLines={3} mb={6}>
          {usbFwUpdateActivated
            ? t("firmwareUpdateRequired.updateAvailableFromLLM.title", {
                deviceName,
              })
            : t("firmwareUpdateRequired.updateNotAvailableFromLLM.title", {
                deviceName,
              })}
        </Text>
        <Text variant="paragraph" textAlign="center" numberOfLines={3} mb={6}>
          {usbFwUpdateActivated
            ? t("firmwareUpdateRequired.updateAvailableFromLLM.description", {
                deviceName,
              })
            : t("firmwareUpdateRequired.updateNotAvailableFromLLM.description", {
                deviceName,
              })}
        </Text>
        {usbFwUpdateActivated ? (
          <ActionContainer marginBottom={0} marginTop={32}>
            <StyledButton
              type="main"
              outline={false}
              title={t("firmwareUpdateRequired.updateAvailableFromLLM.cta")}
              onPress={onPress}
            />
          </ActionContainer>
        ) : null}
      </Flex>
    </Wrapper>
  );
}

export function renderDeviceNotOnboarded({
  t,
  device,
  navigation,
}: {
  t: TFunction;
  device: Device;
  navigation: StackNavigationProp<ParamListBase>;
}) {
  const navigateToOnboarding = () => {
    if (device.modelId === DeviceModelId.stax) {
      // On pairing success, navigate to the Sync Onboarding Companion
      navigation.navigate(NavigatorName.BaseOnboarding, {
        screen: NavigatorName.SyncOnboarding,
        params: {
          screen: ScreenName.SyncOnboardingCompanion,
          params: {
            device,
          },
        },
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore next-line
      navigation.navigate(NavigatorName.BaseOnboarding, {
        screen: NavigatorName.Onboarding,
        params: {
          screen: ScreenName.OnboardingSetNewDevice,
          params: {
            deviceModelId: device.modelId,
          },
        },
      });
    }
  };

  const deviceName = getDeviceModel(device.modelId).productName;

  return (
    <Wrapper>
      <Flex backgroundColor="neutral.c30" p={16} borderRadius={999}>
        <IconsLegacy.InfoAltFillMedium color="primary.c80" size={28} />
      </Flex>
      <Text variant="h4" textAlign="center" mt={6}>
        {t("DeviceAction.deviceNotOnboarded.title")}
      </Text>
      <Text variant="body" color="neutral.c70" textAlign="center" mt={4} mx={4}>
        {t("DeviceAction.deviceNotOnboarded.description", { deviceName })}
      </Text>
      <Button type="main" outline={false} onPress={navigateToOnboarding} mt={7} alignSelf="stretch">
        {t("DeviceAction.button.openOnboarding")}
      </Button>
    </Wrapper>
  );
}

export function renderConnectYourDevice({
  t,
  unresponsive,
  isLocked = false,
  device,
  theme,
  onSelectDeviceLink,
  fullScreen = true,
}: RawProps & {
  unresponsive?: boolean | null;
  isLocked?: boolean;
  device: Device;
  fullScreen?: boolean;
  onSelectDeviceLink?: () => void;
}) {
  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      alignSelf="stretch"
      flex={fullScreen ? 1 : undefined}
    >
      <AnimationContainer>
        <Animation
          source={getDeviceAnimation({
            device,
            key: isLocked || unresponsive ? "enterPinCode" : "plugAndPinCode",
            theme,
          })}
          style={animationStyles(device.modelId)}
        />
      </AnimationContainer>
      {device.deviceName && <ConnectDeviceNameText>{device.deviceName}</ConnectDeviceNameText>}
      <TitleText>
        {t(
          isLocked || unresponsive
            ? "DeviceAction.unlockDevice"
            : device.wired
            ? "DeviceAction.connectAndUnlockDevice"
            : "DeviceAction.turnOnAndUnlockDevice",
        )}
      </TitleText>
      {onSelectDeviceLink ? (
        <ConnectDeviceExtraContentWrapper>
          <ExternalLink
            text={t("DeviceAction.useAnotherDevice")}
            Icon={IconsLegacy.ArrowRightMedium}
            onPress={onSelectDeviceLink}
          />
        </ConnectDeviceExtraContentWrapper>
      ) : null}
    </Flex>
  );
}

export function renderLoading({
  t,
  description,
  lockModal = false,
}: RawProps & {
  description?: string;
  lockModal?: boolean;
}) {
  return (
    <Wrapper>
      <SpinnerContainer>
        <InfiniteLoader mock={Config.MOCK} />
      </SpinnerContainer>
      <CenteredText testID="device-action-loading">
        {description ?? t("DeviceAction.loading")}
      </CenteredText>
      {lockModal ? <ModalLock /> : null}
    </Wrapper>
  );
}

export function renderExchange({
  exchangeType,
  t,
  device,
  theme,
}: RawProps & {
  exchangeType: number;
  device: Device;
}) {
  switch (exchangeType) {
    case 0x00: // swap
      return <div>{"Confirm swap on your device"}</div>;
    case 0x01: // sell
    case 0x02: // fund
      return renderSecureTransferDeviceConfirmation({
        exchangeTypeName: exchangeType === 0x01 ? "confirmSell" : "confirmFund",
        t,
        device,
        theme,
      });
    default:
      return <CenteredText>{"Confirm exchange on your device"}</CenteredText>;
  }
}

export function renderSecureTransferDeviceConfirmation({
  t,
  exchangeTypeName,
  device,
  theme,
}: RawProps & {
  exchangeTypeName: string;
  device: Device;
}) {
  return (
    <Wrapper>
      <AnimationContainer>
        <Animation
          source={getDeviceAnimation({ device, key: "sign", theme })}
          style={animationStyles(device.modelId)}
        />
      </AnimationContainer>
      <TitleText>{t(`DeviceAction.${exchangeTypeName}.title`)}</TitleText>
      <Alert type="primary" learnMoreUrl={urls.swap.learnMore}>
        {t(`DeviceAction.${exchangeTypeName}.alert`)}
      </Alert>
    </Wrapper>
  );
}

export function LoadingAppInstall({
  analyticsPropertyFlow = "unknown",
  request,
  ...props
}: RawProps & {
  analyticsPropertyFlow: string;
  description?: string;
  request?: AppRequest;
}) {
  const currency = request?.currency || request?.account?.currency;
  const appName = request?.appName || currency?.managerAppName;
  useEffect(() => {
    const trackingArgs = ["In-line app install", { appName, flow: analyticsPropertyFlow }] as const;
    track(...trackingArgs);
  }, [appName, analyticsPropertyFlow]);

  return renderLoading({ ...props, lockModal: true });
}

type WarningOutdatedProps = RawProps & {
  colors: Theme["colors"];
  navigation: StackNavigationProp<ParamListBase>;
  appName: string;
  passWarning: () => void;
};

export function renderWarningOutdated({
  t,
  navigation,
  appName,
  passWarning,
  colors,
}: WarningOutdatedProps) {
  function onOpenManager() {
    navigation.navigate(NavigatorName.Manager);
  }

  return (
    <Wrapper>
      <IconContainer>
        <Circle size={60} bg={lighten(colors.yellow, 0.4)}>
          <IconsLegacy.WarningMedium size={28} color={colors.yellow} />
        </Circle>
      </IconContainer>
      <TitleText>{t("DeviceAction.outdated")}</TitleText>
      <DescriptionText>{t("DeviceAction.outdatedDesc", { appName })}</DescriptionText>
      <ActionContainer>
        <StyledButton
          event="DeviceActionWarningOutdatedOpenManager"
          type="primary"
          title={t("DeviceAction.button.openManager")}
          onPress={onOpenManager}
        />
        <StyledButton
          event="DeviceActionWarningOutdatedContinue"
          type="secondary"
          title={t("common.continue")}
          onPress={passWarning}
          outline={false}
        />
      </ActionContainer>
    </Wrapper>
  );
}

export const renderBootloaderStep = ({
  onAutoRepair,
  t,
}: RawProps & { onAutoRepair: () => void }) => (
  <Wrapper>
    <TitleText>{t("DeviceAction.deviceInBootloader.title")}</TitleText>
    <DescriptionText>{t("DeviceAction.deviceInBootloader.description")}</DescriptionText>
    <Button
      mt={4}
      type="color"
      outline={false}
      event="DeviceInBootloaderContinue"
      onPress={onAutoRepair}
    >
      {t("common.continue")}
    </Button>
  </Wrapper>
);

export const AutoRepair = ({
  onDone,
  t,
  device,
  navigation,
  colors,
  theme,
}: RawProps & {
  onDone: () => void;
  device: Device;
  navigation: StackNavigationProp<ParamListBase>;
}) => {
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const sub = firmwareUpdateRepair(device.deviceId, undefined).subscribe({
      next: ({ progress }) => {
        setProgress(progress);
      },
      error: err => {
        setError(err);
      },
      complete: () => {
        onDone();
        navigation.replace(ScreenName.Manager, {});
        // we re-navigate to the manager to reset the selected device for the action
        // if we don't do that, we get an "Invalid Channel" error once the device is back online
        // since the manager still thinks it's connected to a bootloader device and not a normal one
      },
    });

    return () => sub.unsubscribe();
  }, [onDone, setProgress, device, navigation]);

  if (error) {
    return renderError({
      t,
      error,
      colors,
      theme,
    });
  }

  return (
    <Wrapper>
      <TitleText>{t("FirmwareUpdate.preparingDevice")}</TitleText>
      <DeviceActionProgress progress={progress} />
      <DescriptionText>{t("FirmwareUpdate.pleaseWaitUpdate")}</DescriptionText>
    </Wrapper>
  );
};

const ImageLoadingGeneric: React.FC<{
  title: string;
  fullScreen?: boolean;
  children?: React.ReactNode | undefined;
  progress?: number;
  lottieSource?: FramedImageWithLottieProps["lottieSource"];
}> = ({ title, fullScreen = true, children, progress, lottieSource }) => {
  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      alignSelf="stretch"
      flex={fullScreen ? 1 : undefined}
    >
      <Flex {...(fullScreen ? StyleSheet.absoluteFillObject : {})}>
        <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={8} alignSelf="stretch">
          {title}
        </Text>
      </Flex>
      <Flex flexDirection={"column"} alignItems="center" alignSelf="stretch">
        {lottieSource ? (
          <StaxFramedLottieWithContext loadingProgress={progress} lottieSource={lottieSource}>
            {children}
          </StaxFramedLottieWithContext>
        ) : (
          <StaxFramedImageWithContext loadingProgress={progress} frameConfig={transferConfig}>
            {children}
          </StaxFramedImageWithContext>
        )}
      </Flex>
    </Flex>
  );
};

export const renderImageLoadRequested = ({
  t,
  device,
  fullScreen = true,
  wording,
}: RawProps & { device: Device; fullScreen?: boolean; wording?: string }) => {
  return (
    <ImageLoadingGeneric
      fullScreen={fullScreen}
      title={
        wording ??
        t("customImage.allowPreview", {
          productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
        })
      }
      lottieSource={allowConnection}
      progress={0}
    />
  );
};

export const renderLoadingImage = ({
  t,
  device,
  progress,
}: RawProps & { progress: number; device: Device }) => {
  return (
    <ImageLoadingGeneric
      title={t(
        progress > 0.9 ? "customImage.loadingPictureAlmostOver" : "customImage.loadingPicture",
        {
          productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
        },
      )}
      progress={progress}
    />
  );
};

export const renderImageCommitRequested = ({
  t,
  device,
  fullScreen = true,
  wording,
}: RawProps & { device: Device; fullScreen?: boolean; wording?: string }) => {
  return (
    <ImageLoadingGeneric
      fullScreen={fullScreen}
      title={
        wording ??
        t("customImage.commitRequested", {
          productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
        })
      }
      lottieSource={confirmLockscreen}
      progress={0.89} // hardcoded value to not have the image overflowing the "confirm button" in the lottie
    />
  );
};
