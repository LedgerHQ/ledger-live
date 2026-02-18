import React, { useEffect, useState } from "react";
import type { TFunction } from "i18next";
import { Image, Linking, ScrollView } from "react-native";
import Config from "react-native-config";
import { useSelector } from "~/context/hooks";
import styled, { useTheme } from "styled-components/native";
import { useTranslation } from "~/context/Locale";

import { ParamListBase, T } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { getDeviceModel } from "@ledgerhq/devices";
import {
  BluetoothRequired,
  LockedDeviceError,
  PeerRemovedPairing,
  WrongDeviceForAccount,
  FirmwareNotRecognized,
  UnsupportedFeatureError,
  NanoSNotSupported,
} from "@ledgerhq/errors";
import { isSyncOnboardingSupported } from "@ledgerhq/live-common/device/use-cases/screenSpecs";
import { ExchangeRate, ExchangeSwap } from "@ledgerhq/live-common/exchange/swap/types";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { AppRequest } from "@ledgerhq/live-common/hw/actions/app";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import firmwareUpdateRepair from "@ledgerhq/live-common/hw/firmwareUpdate-repair";
import { isInvalidGetFirmwareMetadataResponseError } from "@ledgerhq/live-dmk-mobile";
import { WalletState } from "@ledgerhq/live-wallet/store";
import {
  BoxedIcon,
  Flex,
  Icons,
  IconsLegacy,
  InfiniteLoader,
  Link,
  Log,
  Tag,
  Text,
} from "@ledgerhq/native-ui";
import { DownloadMedium } from "@ledgerhq/native-ui/assets/icons";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeviceModelInfo } from "@ledgerhq/types-live";

import { TrackScreen, track, useTrack } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { MANAGER_TABS } from "~/const/manager";
import { getDeviceAnimation, getDeviceAnimationStyles } from "~/helpers/getDeviceAnimation";
import { lastSeenDeviceSelector } from "~/reducers/settings";
import { SettingsState } from "~/reducers/types";
import { urls } from "~/utils/urls";
import { Theme, lighten } from "../../colors";
import Alert from "../Alert";
import Animation from "../Animation";
import Button from "../Button";
import Circle from "../Circle";
import DeviceActionProgress from "../DeviceActionProgress";
import ExternalLink from "../ExternalLink";
import GenericErrorView from "../GenericErrorView";
import ModalLock from "../ModalLock";
import { RootStackParamList } from "../RootNavigator/types/RootNavigator";
import TermsFooter, { TermsProviders } from "../TermsFooter";
import { BleForgetDeviceIllustration } from "../BleDevicePairingFlow/BleDevicePairingContent/BleForgetDeviceIllustration";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";

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
  m: 6,
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

export type RawProps = {
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
          source={getDeviceAnimation({ modelId: device.modelId, key: "quitApp", theme })}
          style={getDeviceAnimationStyles(device.modelId)}
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
  navigation: NativeStackNavigationProp<ParamListBase>;
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
            navigation.navigate(NavigatorName.MyLedger, {
              screen: ScreenName.MyLedgerChooseDevice,
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
          source={getDeviceAnimation({ modelId: device.modelId, key: "verify", theme })}
          style={getDeviceAnimationStyles(device.modelId)}
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
  provider,
  transaction,
}: RawProps & {
  device: Device;
  transaction: Transaction;
  provider: TermsProviders;
  exchangeRate: ExchangeRate;
  exchange: ExchangeSwap;
  amountExpectedTo?: string | null;
  estimatedFees?: string | null;
  walletState: WalletState;
  settingsState: SettingsState;
}) {
  return (
    <ScrollView testID="confirm-swap-on-device">
      <Wrapper width="100%" mt="40%" mb="30%">
        <Wrapper rowGap={16} mr="16px" ml="16px">
          <AnimationContainer marginTop="16px">
            <Animation
              source={getDeviceAnimation({ modelId: device.modelId, key: "sign", theme })}
              style={getDeviceAnimationStyles(device.modelId)}
            />
          </AnimationContainer>
          <TitleText>{t("DeviceAction.confirmSwap.title")}</TitleText>
          <Text textAlign="center" color={"neutral.c70"} fontSize={14} fontWeight="medium" px={16}>
            {t(`DeviceAction.confirmSwap.alert.default`)}
          </Text>
        </Wrapper>
      </Wrapper>
      <TermsFooter
        provider={provider}
        sponsored={transaction.family === "evm" && transaction.sponsored}
      />
      <ModalLock />
    </ScrollView>
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
          source={getDeviceAnimation({ modelId: device.modelId, key: "allowManager", theme })}
          style={getDeviceAnimationStyles(device.modelId)}
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
          source={getDeviceAnimation({ modelId: device.modelId, key, theme })}
          style={getDeviceAnimationStyles(device.modelId)}
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
      <AnimationContainer>
        <Animation
          source={getDeviceAnimation({ modelId: device.modelId, key, theme })}
          style={getDeviceAnimationStyles(device.modelId)}
        />
        <Text variant="h3Inter" fontWeight="semiBold" fontSize="24px" textAlign="center" mt={8}>
          {t("DeviceAction.allowRemoveCustomLockscreen", { productName })}
        </Text>
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
  navigation: NativeStackNavigationProp<ParamListBase>;
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
            modelId: device.modelId,
            key: "openApp",
            theme,
          })}
          style={getDeviceAnimationStyles(device.modelId)}
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
  navigation: NativeStackNavigationProp<ParamListBase>;
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
  navigation?: NativeStackNavigationProp<RootStackParamList>;
  error: Error;
  onRetry?: (() => void) | null;
  managerAppName?: string;
  Icon?: React.ComponentProps<typeof GenericErrorView>["Icon"];
  iconColor?: string;
  device?: Device;
  hasExportLogButton?: boolean;
}) {
  if (error instanceof LockedDeviceError) {
    return renderLockedDeviceError({ t, onRetry, device });
  } else if (error instanceof PeerRemovedPairing) {
    // User needs to forget the device on their phone settings
    const productName = device ? getDeviceModel(device?.modelId).productName : "Ledger Device";
    return (
      <Flex flex={1}>
        <BleForgetDeviceIllustration productName={productName} onRetry={() => onRetry?.()} />
      </Flex>
    );
  } else {
    const renderErrorButtons = (error: Error, managerAppName?: string) => {
      type CTA = "OpenExperimentalSettings" | "Retry" | "None";
      const getCTA = (error: Error, hasRetry: boolean): CTA => {
        if (
          isInvalidGetFirmwareMetadataResponseError(error) ||
          error instanceof FirmwareNotRecognized
        ) {
          return "OpenExperimentalSettings";
        } else if (!(error instanceof PeerRemovedPairing) && hasRetry) {
          return "Retry";
        }
        return "None";
      };

      const hasRetry = Boolean(onRetry || managerAppName);
      const cta = getCTA(error, hasRetry);

      switch (cta) {
        case "OpenExperimentalSettings": {
          const onPressGoToExperimentalSettings = () => {
            if (navigation) {
              navigation.navigate(NavigatorName.Base, {
                screen: NavigatorName.Settings,
                params: {
                  screen: ScreenName.ExperimentalSettings,
                },
              });
            }
          };
          return (
            <Flex alignSelf="stretch" mb={0} mt={0}>
              <StyledButton
                event="DeviceActionErrorRetry"
                type="main"
                size="large"
                outline={false}
                title={t("errors.InvalidGetFirmwareMetadataResponseError.openSettings")}
                onPress={onPressGoToExperimentalSettings}
              />
            </Flex>
          );
        }
        case "Retry": {
          const onPressRetry = () => {
            if (managerAppName && navigation) {
              navigation.navigate(NavigatorName.Base, {
                screen: NavigatorName.Main,
                params: {
                  screen: NavigatorName.MyLedger,
                  params: {
                    screen: ScreenName.MyLedgerChooseDevice,
                    params: {
                      tab: MANAGER_TABS.INSTALLED_APPS,
                      updateModalOpened: true,
                      device,
                    },
                  },
                },
              });
            } else {
              onRetry?.();
            }
          };
          return (
            <Flex alignSelf="stretch" mb={0} mt={error instanceof BluetoothRequired ? 0 : 8}>
              <StyledButton
                event="DeviceActionErrorRetry"
                type="main"
                size="large"
                outline={false}
                title={managerAppName ? t("DeviceAction.button.openManager") : t("common.retry")}
                onPress={onPressRetry}
              />
            </Flex>
          );
        }
        default:
          return null;
      }
    };
    return (
      <Wrapper>
        {error instanceof UnsupportedFeatureError ? (
          <TrackScreen category="Unsupported Feature" name="Error: App Unavailable" />
        ) : null}
        <GenericErrorView
          error={error}
          withDescription
          Icon={Icon}
          iconColor={iconColor}
          hasExportLogButton={hasExportLogButton}
        >
          {renderErrorButtons(error, managerAppName)}
        </GenericErrorView>
      </Wrapper>
    );
  }
}

export function UnsupportedFeatureComponent({ error }: { readonly error: Error }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const contactSupportUrl = useLocalizedUrl(urls.contact);

  return (
    <Wrapper>
      <TrackScreen category="Unsupported Feature" name="Error: App Unavailable" />
      <GenericErrorView
        error={error}
        withDescription
        Icon={Icons.DeleteCircleFill}
        iconColor={colors.error.c60}
        hasExportLogButton={false}
      >
        <Flex alignSelf="stretch" mb={20} mt={8}>
          <StyledButton
            type="main"
            size="large"
            outline={false}
            title={t("errors.UnsupportedFeatureError.ctaLabel")}
            onPress={() => Linking.openURL(contactSupportUrl)}
          />
        </Flex>
      </GenericErrorView>
    </Wrapper>
  );
}

export function NanoSNotSupportedComponent() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const nanoSUpgradeProgramUrl = useLocalizedUrl(urls.nanoSUpgradeProgram);
  const nanoSLimitationsUrl = useLocalizedUrl(urls.nanoSLimitations);

  return (
    <Wrapper>
      <TrackScreen category="LNS Upsell Ledger Sync" />
      <GenericErrorView
        error={new NanoSNotSupported()}
        withDescription
        Icon={Icons.DeleteCircleFill}
        iconColor={colors.error.c60}
        hasExportLogButton={false}
      >
        <Flex alignSelf="stretch" mb={20} mt={8}>
          <StyledButton
            type="main"
            size="large"
            title={t("errors.NanoSNotSupported.upsellCtaLabel")}
            onPress={() => Linking.openURL(nanoSUpgradeProgramUrl)}
          />
          <Link
            type="shade"
            size="large"
            style={{ marginTop: 20 }}
            onPress={() => Linking.openURL(nanoSLimitationsUrl)}
          >
            {t("common.learnMore")}
          </Link>
        </Flex>
      </GenericErrorView>
    </Wrapper>
  );
}

export function RequiredFirmwareUpdate({
  device,
  navigation,
}: Omit<RawProps, "t"> & {
  navigation: NativeStackNavigationProp<ParamListBase>;
  device: Device;
}) {
  const { t } = useTranslation();
  const track = useTrack();
  const lastSeenDevice: DeviceModelInfo | null | undefined = useSelector(lastSeenDeviceSelector);

  const usbFwUpdateActivated = !!lastSeenDevice;
  const deviceName = getDeviceModel(device.modelId).productName;
  const isDeviceConnectedViaUSB = device.wired;

  // Goes to the manager if a firmware update is available, but only automatically
  // displays the firmware update drawer if the device is already connected via USB
  const onPress = () => {
    track("button_clicked", {
      button: "OpenMyLedger",
      page: "Update_OS_To_Continue",
    });
    navigation.reset({
      index: 0,
      routes: [
        {
          name: NavigatorName.Base,
          state: {
            routes: [
              {
                name: NavigatorName.Main,
                state: {
                  routes: [
                    {
                      name: NavigatorName.MyLedger,
                      state: {
                        routes: [
                          {
                            name: ScreenName.MyLedgerChooseDevice,
                            params: { device, firmwareUpdate: isDeviceConnectedViaUSB },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  };

  return (
    <Wrapper>
      <Flex flexDirection="column" alignItems="center" alignSelf="stretch">
        <TrackScreen category="Firmware Update" name="Error: App Unavailable Update Firmware" />
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
  navigation: NativeStackNavigationProp<ParamListBase>;
}) {
  const navigateToOnboarding = () => {
    if (isSyncOnboardingSupported(device.modelId)) {
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
          screen: ScreenName.OnboardingUseCase,
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

function useGetRawProps(): Omit<RawProps, "colors"> {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const theme = colors.type as "light" | "dark";

  return {
    t,
    theme,
  };
}

export const ConnectYourDevice: React.FC<
  Readonly<{
    unresponsive?: boolean | null;
    isLocked?: boolean;
    device: Device;
    fullScreen?: boolean;
    onSelectDeviceLink?: () => void;
  }>
> = ({ unresponsive, isLocked = false, device, onSelectDeviceLink, fullScreen = true }) => {
  const { t, theme } = useGetRawProps();

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
            modelId: device.modelId,
            key: isLocked || unresponsive ? "enterPinCode" : "plugAndPinCode",
            theme,
          })}
          style={getDeviceAnimationStyles(device.modelId)}
        />
      </AnimationContainer>
      {device.deviceName && <ConnectDeviceNameText>{device.deviceName}</ConnectDeviceNameText>}
      <TitleText>
        {t(
          isLocked || unresponsive
            ? "DeviceAction.unlockDevice"
            : device.wired
              ? "DeviceAction.connectAndUnlockDevice"
              : "DeviceAction.powerOnDevice",
          { deviceName: getDeviceModel(device.modelId).productName },
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
};

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
        <InfiniteLoader mock={!!Config.DETOX} testID="device-action-loading" />
      </SpinnerContainer>
      <CenteredText>{description ?? t("DeviceAction.loading")}</CenteredText>
      {lockModal ? <ModalLock /> : null}
    </Wrapper>
  );
}

export function renderExchange({
  swapRequest,
  exchangeType,
  t,
  device,
  theme,
}: RawProps & {
  swapRequest: {
    provider: TermsProviders;
    selectedDevice: Device;
    transaction: Transaction;
    exchangeRate: ExchangeRate;
    exchange: ExchangeSwap;
    colors: T["colors"];
    theme: typeof theme;
    amountExpectedTo?: string;
    estimatedFees?: string;
    walletState: WalletState;
    settingsState: SettingsState;
  };
  exchangeType: number;
  device: Device;
}) {
  switch (exchangeType) {
    case 0x00: // swap
      return renderConfirmSwap({
        t,
        provider: swapRequest.provider,
        device: swapRequest.selectedDevice,
        colors: swapRequest.colors,
        theme: swapRequest.theme,
        transaction: swapRequest?.transaction,
        exchangeRate: swapRequest?.exchangeRate,
        exchange: swapRequest?.exchange,
        amountExpectedTo: swapRequest.amountExpectedTo,
        estimatedFees: swapRequest.estimatedFees,
        walletState: swapRequest.walletState,
        settingsState: swapRequest.settingsState,
      });
    case 0x01: // sell
    case 0x02: // fund
      return renderSecureTransferDeviceConfirmation({
        exchangeTypeName: exchangeType === 0x01 ? "confirmSell" : "confirmFund",
        t,
        device,
        theme,
      });
    default:
      return <CenteredText>{t("DeviceAction.confirmExchangeOnDevice")}</CenteredText>;
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
          source={getDeviceAnimation({ modelId: device.modelId, key: "sign", theme })}
          style={getDeviceAnimationStyles(device.modelId)}
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
  appName: string | null | undefined;
  description?: string;
  request?: AppRequest;
}) {
  const currency = request?.currency || request?.account?.currency;
  const appNameToTrack = props.appName ?? request?.appName ?? currency?.managerAppName;

  useEffect(() => {
    track(`${appNameToTrack?.replace(/\s/g, "").toLowerCase()}_installed`, {
      flow: analyticsPropertyFlow,
      installType: "inline",
    });
  }, [analyticsPropertyFlow, appNameToTrack]);

  return renderLoading({ ...props, lockModal: true });
}

type WarningOutdatedProps = RawProps & {
  colors: Theme["colors"];
  navigation: NativeStackNavigationProp<ParamListBase>;
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
    navigation.navigate(NavigatorName.MyLedger, {
      screen: ScreenName.MyLedgerChooseDevice,
    });
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
  navigation: NativeStackNavigationProp<ParamListBase>;
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
        navigation.replace(ScreenName.MyLedgerChooseDevice, {});
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

const HARDWARE_UPDATE_ASSETS: Partial<Record<DeviceModelId, number>> = {
  nanoS: require("../../../assets/images/swap/nanoSBackdropFilter.webp"),
};

export const HardwareUpdate = ({
  t,
  device,
  i18nKeyTitle,
  i18nKeyDescription,
  i18nKeyValues,
}: {
  t: RawProps["t"];
  device: Device;
  i18nKeyTitle: string;
  i18nKeyDescription: string;
  i18nKeyValues?: { [key: string]: string | number };
}) => {
  const openUrl = (url: string) => Linking.openURL(url);

  return (
    <Flex flex={1} justifyContent="center" minHeight="160px">
      <AnimationContainer height="200px">
        <Image
          source={HARDWARE_UPDATE_ASSETS[device.modelId]}
          style={{ height: 200, width: 200 }}
          resizeMode={"contain"}
        />
      </AnimationContainer>
      <Text variant="h4" fontWeight="semiBold">
        {t(i18nKeyTitle, i18nKeyValues)}
      </Text>
      <Text pt={4} color="neutral.c70" variant={"body"} lineHeight={"150%"} fontWeight={"medium"}>
        {t(i18nKeyDescription, i18nKeyValues)}
      </Text>
      <Button
        type="main"
        outline={false}
        onPress={() => openUrl("https://shop.ledger.com/pages/hardware-wallet")}
        mt={8}
        alignSelf="stretch"
      >
        {t("transfer.swap2.incompatibility.explore_compatible_devices")}
      </Button>
      <Button
        type="shade"
        outline
        onPress={() => openUrl("https://support.ledger.com")}
        mt={4}
        alignSelf="stretch"
      >
        {t("transfer.swap2.incompatibility.contact_support")}
      </Button>
    </Flex>
  );
};
