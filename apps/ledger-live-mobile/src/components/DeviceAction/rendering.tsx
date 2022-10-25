import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useDispatch } from "react-redux";
import styled from "styled-components/native";
import { WrongDeviceForAccount } from "@ledgerhq/errors";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppRequest } from "@ledgerhq/live-common/hw/actions/app";
import firmwareUpdateRepair from "@ledgerhq/live-common/hw/firmwareUpdate-repair";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import {
  InfiniteLoader,
  Text,
  Flex,
  Tag,
  Icons,
  Log,
} from "@ledgerhq/native-ui";
import BigNumber from "bignumber.js";
import {
  ExchangeRate,
  Exchange,
} from "@ledgerhq/live-common/exchange/swap/types";
import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
  getAccountName,
} from "@ledgerhq/live-common/account/index";
import { TFunction } from "react-i18next";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { setModalLock } from "../../actions/appstate";
import { urls } from "../../config/urls";
import Alert from "../Alert";
import { lighten } from "../../colors";
import Button from "../Button";
import DeviceActionProgress from "../DeviceActionProgress";
import { NavigatorName, ScreenName } from "../../const";
import Animation from "../Animation";
import { getDeviceAnimation } from "../../helpers/getDeviceAnimation";
import GenericErrorView from "../GenericErrorView";
import Circle from "../Circle";
import { MANAGER_TABS } from "../../const/manager";
import { providerIcons } from "../../icons/swap/index";
import ExternalLink from "../ExternalLink";
import { track } from "../../analytics";
import CurrencyUnitValue from "../CurrencyUnitValue";
import CurrencyIcon from "../CurrencyIcon";
import TermsFooter from "../TermsFooter";
import Illustration from "../../images/illustration/Illustration";
import { FramedImageWithContext } from "../CustomImage/FramedImage";

import notOnboardedDarkImg from "../../images/illustration/Dark/_010.png";
import notOnboardedLightImg from "../../images/illustration/Light/_010.png";

const Wrapper = styled(Flex).attrs({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  minHeight: "160px",
})``;

const AnimationContainer = styled(Flex).attrs(p => ({
  alignSelf: "stretch",
  alignItems: "center",
  justifyContent: "center",
  height: p.withConnectDeviceHeight
    ? "100px"
    : p.withVerifyAddressHeight
    ? "72px"
    : undefined,
}))``;

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

const TitleContainer = styled(Flex).attrs({
  py: 8,
})``;

const TitleText = ({
  children,
  disableUppercase,
}: {
  children: React.ReactNode;
  disableUppercase?: boolean;
}) => (
  <TitleContainer>
    <Log
      extraTextProps={disableUppercase ? { textTransform: "none" } : undefined}
    >
      {children}
    </Log>
  </TitleContainer>
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

type RawProps = {
  t: (key: string, options?: { [key: string]: string | number }) => string;
  colors?: any;
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
  navigation: any;
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
      <AnimationContainer withVerifyAddressHeight={device.modelId !== "blue"}>
        <Animation
          source={getDeviceAnimation({ device, key: "validate", theme })}
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
        {address && <TitleText disableUppercase>{address}</TitleText>}
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
  amountExpectedTo?: string;
  estimatedFees?: string;
}) {
  const ProviderIcon = providerIcons[exchangeRate.provider.toLowerCase()];

  return (
    <ScrollView>
      <Wrapper width="100%">
        <Alert type="primary" learnMoreUrl={urls.swap.learnMore}>
          {t("DeviceAction.confirmSwap.alert")}
        </Alert>
        <AnimationContainer
          marginTop="16px"
          withVerifyAddressHeight={device.modelId !== "blue"}
        >
          <Animation
            source={getDeviceAnimation({ device, key: "validate", theme })}
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
                value={
                  amountExpectedTo
                    ? new BigNumber(amountExpectedTo)
                    : exchangeRate.toAmount
                }
                disableRounding
                showCode
              />
            </Text>
          </FieldItem>

          <FieldItem title={t("DeviceAction.swap2.provider")}>
            <Flex flexDirection="row" alignItems="center">
              <Flex paddingRight={2}>
                <ProviderIcon size={14} />
              </Flex>

              <Text>{getProviderName(exchangeRate.provider)}</Text>
            </Flex>
          </FieldItem>

          <FieldItem title={t("DeviceAction.swap2.fees")}>
            <Text>
              <CurrencyUnitValue
                unit={getAccountUnit(
                  getMainAccount(
                    exchange.fromAccount,
                    exchange.fromParentAccount,
                  ),
                )}
                value={new BigNumber(estimatedFees || 0)}
                disableRounding
                showCode
              />
            </Text>
          </FieldItem>

          <FieldItem title={t("DeviceAction.swap2.sourceAccount")}>
            <Flex flexDirection="row" alignItems="center">
              <CurrencyIcon
                size={20}
                currency={getAccountCurrency(exchange.fromAccount)}
              />
              <Text marginLeft={2}>{getAccountName(exchange.fromAccount)}</Text>
            </Flex>
          </FieldItem>

          <FieldItem title={t("DeviceAction.swap2.targetAccount")}>
            <Flex flexDirection="row" alignItems="center">
              <CurrencyIcon
                size={20}
                currency={getAccountCurrency(exchange.toAccount)}
              />
              <Text marginLeft={2}>{getAccountName(exchange.toAccount)}</Text>
            </Flex>
          </FieldItem>
        </Flex>

        <TermsFooter provider={exchangeRate.provider} />
      </Wrapper>
    </ScrollView>
  );
}

function FieldItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Flex flexDirection="row" justifyContent="space-between" paddingY={4}>
      <Text color="neutral.c70">{title}</Text>

      <Flex flexDirection="row" alignItems="center">
        {children}
      </Flex>
    </Flex>
  );
}

export function renderConfirmSell({
  t,
  device,
}: RawProps & {
  device: Device;
}) {
  return (
    <Wrapper>
      <Alert type="primary" learnMoreUrl={urls.swap.learnMore}>
        {t("DeviceAction.confirmSell.alert")}
      </Alert>
      <AnimationContainer
        marginTop="16px"
        withVerifyAddressHeight={device.modelId !== "blue"}
      >
        <Animation source={getDeviceAnimation({ device, key: "validate" })} />
      </AnimationContainer>
      <TitleText>{t("DeviceAction.confirmSell.title")}</TitleText>
    </Wrapper>
  );
}

export function renderAllowManager({
  t,
  wording,
  device,
  theme,
}: RawProps & {
  wording: string;
  device: Device;
}) {
  // TODO: disable gesture, modal close, hide header buttons
  return (
    <Wrapper>
      <AnimationContainer>
        <Animation
          source={getDeviceAnimation({ device, key: "allowManager", theme })}
        />
      </AnimationContainer>
      <CenteredText>
        {t("DeviceAction.allowManagerPermission", { wording })}
      </CenteredText>
    </Wrapper>
  );
}

export function renderAllowLanguageInstallation({
  t,
  device,
  theme,
}: RawProps & {
  device: Device;
}) {
  const deviceName = getDeviceModel(device.modelId).productName;

  return (
    <Wrapper>
      <Text variant="h4" textAlign="center">
        {t("deviceLocalization.allowLanguageInstallation", { deviceName })}
      </Text>
      <AnimationContainer>
        <Animation
          source={getDeviceAnimation({ device, key: "validate", theme })}
        />
      </AnimationContainer>
    </Wrapper>
  );
}

const AllowOpeningApp = ({
  t,
  navigation,
  wording,
  tokenContext,
  isDeviceBlocker,
  device,
  theme,
}: RawProps & {
  navigation: any;
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
          source={getDeviceAnimation({ device, key: "openApp", theme })}
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
  navigation: any;
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
  onRetry?: () => void;
}) {
  return renderError({
    t,
    error: new WrongDeviceForAccount(),
    onRetry,
    colors,
    theme,
  });
}

export function renderError({
  t,
  error,
  onRetry,
  managerAppName,
  navigation,
  Icon,
  iconColor,
}: RawProps & {
  navigation?: any;
  error: Error;
  onRetry?: () => void;
  managerAppName?: string;
  Icon?: React.ComponentProps<typeof GenericErrorView>["Icon"];
  iconColor?: string;
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
  return (
    <Wrapper>
      <GenericErrorView
        error={error}
        withDescription
        withIcon
        Icon={Icon}
        iconColor={iconColor}
      >
        {onRetry || managerAppName ? (
          <ActionContainer marginBottom={0} marginTop={32}>
            <StyledButton
              event="DeviceActionErrorRetry"
              type="main"
              outline={false}
              title={
                managerAppName
                  ? t("DeviceAction.button.openManager")
                  : t("common.retry")
              }
              onPress={onPress}
            />
          </ActionContainer>
        ) : null}
      </GenericErrorView>
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
  // TODO: correctly type the navigation prop here AND in the DeviceAction component
  navigation: any;
}) {
  const navigateToOnboarding = () => {
    if (device.modelId === DeviceModelId.nanoFTS) {
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
      <Illustration
        lightSource={notOnboardedLightImg}
        darkSource={notOnboardedDarkImg}
        size={175}
      />
      <Text variant="h4" textAlign="center" mt={4}>
        {t("DeviceAction.deviceNotOnboarded.title")}
      </Text>
      <Text variant="body" color="neutral.c70" textAlign="center" mt={4} mx={4}>
        {t("DeviceAction.deviceNotOnboarded.description", { deviceName })}
      </Text>
      <Button
        type="main"
        outline={false}
        onPress={navigateToOnboarding}
        mt={7}
        alignSelf="stretch"
      >
        {t("DeviceAction.button.openOnboarding")}
      </Button>
    </Wrapper>
  );
}

export function renderConnectYourDevice({
  t,
  unresponsive,
  device,
  theme,
  onSelectDeviceLink,
}: RawProps & {
  unresponsive: boolean;
  device: Device;
  onSelectDeviceLink?: () => void;
}) {
  return (
    <Wrapper>
      <AnimationContainer
        withConnectDeviceHeight={
          ![DeviceModelId.blue, DeviceModelId.nanoFTS].includes(device.modelId)
        }
      >
        <Animation
          source={getDeviceAnimation({
            device,
            key: unresponsive ? "enterPinCode" : "plugAndPinCode",
            theme,
          })}
        />
      </AnimationContainer>
      {device.deviceName && (
        <ConnectDeviceNameText>{device.deviceName}</ConnectDeviceNameText>
      )}
      <TitleText>
        {t(
          unresponsive
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
            Icon={Icons.ArrowRightMedium}
            onPress={onSelectDeviceLink}
          />
        </ConnectDeviceExtraContentWrapper>
      ) : null}
    </Wrapper>
  );
}

export function renderLoading({
  t,
  description,
}: RawProps & {
  description?: string;
}) {
  return (
    <Wrapper>
      <SpinnerContainer>
        <InfiniteLoader />
      </SpinnerContainer>
      <CenteredText>{description ?? t("DeviceAction.loading")}</CenteredText>
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
          source={getDeviceAnimation({ device, key: "validate", theme })}
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
  const dispatch = useDispatch();

  useEffect(() => {
    // Nb Blocks closing the modal while the install is happening.
    // releases the block on onmount.
    dispatch(setModalLock(true));
    return () => {
      dispatch(setModalLock(false));
    };
  }, [dispatch]);

  const currency = request?.currency || request?.account?.currency;
  const appName = request?.appName || currency?.managerAppName;
  useEffect(() => {
    const trackingArgs = [
      "In-line app install",
      { appName, flow: analyticsPropertyFlow },
    ];
    track(...trackingArgs);
  }, [appName, analyticsPropertyFlow]);
  return renderLoading(props);
}

type WarningOutdatedProps = RawProps & {
  colors: any;
  navigation: any;
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
          <Icons.WarningMedium size={28} color={colors.yellow} />
        </Circle>
      </IconContainer>
      <TitleText>{t("DeviceAction.outdated")}</TitleText>
      <DescriptionText>
        {t("DeviceAction.outdatedDesc", { appName })}
      </DescriptionText>
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
    <DescriptionText>
      {t("DeviceAction.deviceInBootloader.description")}
    </DescriptionText>
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
  navigation: StackNavigationProp<any>;
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
  children?: React.ReactNode | undefined;
  top?: React.ReactNode | undefined;
  bottom?: React.ReactNode | undefined;
  progress?: number;
  backgroundPlaceholderText?: string;
}> = ({
  title,
  top,
  bottom,
  children,
  progress,
  backgroundPlaceholderText,
}) => {
  return (
    <Flex
      flexDirection="column"
      justifyContent="space-between"
      alignItems="center"
      flex={1}
      alignSelf="stretch"
    >
      <Flex flex={1} flexDirection="column" alignItems={"center"}>
        {top}
      </Flex>
      <Flex flexDirection={"column"} alignItems="center" alignSelf="stretch">
        <Text textAlign="center" variant="large" mb={10} alignSelf="stretch">
          {title}
        </Text>
        <FramedImageWithContext
          loadingProgress={progress}
          backgroundPlaceholderText={backgroundPlaceholderText}
        >
          {children}
        </FramedImageWithContext>
      </Flex>
      <Flex flex={1} flexDirection="column" alignItems={"center"}>
        {bottom}
      </Flex>
    </Flex>
  );
};

export const renderImageLoadRequested = ({
  t,
  device,
}: RawProps & { device: Device }) => {
  return (
    <ImageLoadingGeneric
      title={t("customImage.allowPreview", {
        productName:
          device.deviceName || getDeviceModel(device.modelId)?.productName,
      })}
      progress={0}
      backgroundPlaceholderText="load requested illustration placeholder"
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
      title={t("customImage.loadingPicture", {
        productName:
          device.deviceName || getDeviceModel(device.modelId)?.productName,
      })}
      progress={progress}
      backgroundPlaceholderText="image loading illustration placeholder"
      bottom={
        <Flex flexDirection="column" flex={1} justifyContent="flex-end" pb={8}>
          <Text textAlign="center" variant="bodyLineHeight" color="neutral.c60">
            {t("customImage.timeDisclaimer")}
          </Text>
        </Flex>
      }
    />
  );
};

export const renderImageCommitRequested = ({
  t,
  device,
}: RawProps & { device: Device }) => {
  return (
    <ImageLoadingGeneric
      title={t("customImage.confirmPicture", {
        productName:
          device.deviceName || getDeviceModel(device.modelId)?.productName,
      })}
      backgroundPlaceholderText="commit requested illustration placeholder"
      top={
        <Flex
          flex={1}
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Flex mb={3} p={4} backgroundColor="neutral.c30" borderRadius={999}>
            <Icons.CheckAloneMedium size={16} color="success.c50" />
          </Flex>
          <Text textAlign="center" color="neutral.c70" variant="bodyLineHeight">
            {t("customImage.pictureLoaded")}
          </Text>
        </Flex>
      }
    />
  );
};
