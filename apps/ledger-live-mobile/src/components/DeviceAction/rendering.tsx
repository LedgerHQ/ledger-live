import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components/native";
import { WrongDeviceForAccount, UnexpectedBootloader } from "@ledgerhq/errors";
import { TokenCurrency } from "@ledgerhq/live-common/types/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppRequest } from "@ledgerhq/live-common/hw/actions/app";
import firmwareUpdateRepair from "@ledgerhq/live-common/hw/firmwareUpdate-repair";
import {
  InfiniteLoader,
  Text,
  Flex,
  Tag,
  Icons,
  Log,
} from "@ledgerhq/native-ui";
import { setModalLock } from "../../actions/appstate";
import { urls } from "../../config/urls";
import Alert from "../Alert";
import { lighten } from "../../colors";
import Button from "../Button";
import DeviceActionProgress from "../DeviceActionProgress";
import { NavigatorName, ScreenName } from "../../const";
import Animation from "../Animation";
import getDeviceAnimation from "./getDeviceAnimation";
import GenericErrorView from "../GenericErrorView";
import Circle from "../Circle";
import { MANAGER_TABS } from "../../screens/Manager/Manager";
import ExternalLink from "../ExternalLink";
import { track } from "../../analytics";
import TermsFooter, { TermsProviders } from "../TermsFooter";

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
  provider,
}: RawProps & {
  device: Device;
  provider?: TermsProviders;
}) {
  return (
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
      <TermsFooter provider={provider} />
    </Wrapper>
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
  return (
    <Wrapper>
      <AnimationContainer>
        <Animation
          source={getDeviceAnimation({ device, key: "validate", theme })}
        />
      </AnimationContainer>
      <Log>
        {t("deviceLocalization.allowLanguageInstallation")}
      </Log>
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
}: RawProps & {
  navigation?: any;
  error: Error;
  onRetry?: () => void;
  managerAppName?: string;
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
      <GenericErrorView error={error} withDescription withIcon>
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
      <AnimationContainer withConnectDeviceHeight={device.modelId !== "blue"}>
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
