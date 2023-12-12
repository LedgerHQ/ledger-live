import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { Action, Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  DeviceNotOnboarded,
  ImageDoesNotExistOnDevice,
  LatestFirmwareVersionRequired,
} from "@ledgerhq/live-common/errors";
import {
  TransportStatusError,
  UserRefusedDeviceNameChange,
  UserRefusedOnDevice,
} from "@ledgerhq/errors";
import { useTranslation } from "react-i18next";
import { ParamListBase, useNavigation, useTheme } from "@react-navigation/native";
import { useTheme as useThemeFromStyledComponents } from "styled-components/native";
import { Flex, Text, Icons } from "@ledgerhq/native-ui";
import type { AppRequest } from "@ledgerhq/live-common/hw/actions/app";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike, AnyMessage, DeviceInfo } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Exchange, ExchangeRate, InitSwapResult } from "@ledgerhq/live-common/exchange/swap/types";
import { AppAndVersion } from "@ledgerhq/live-common/hw/connectApp";
import { LedgerErrorConstructor } from "@ledgerhq/errors/lib/helpers";
import { StackNavigationProp } from "@react-navigation/stack";
import { setLastSeenDeviceInfo } from "~/actions/settings";
import ValidateOnDevice from "../ValidateOnDevice";
import ValidateMessageOnDevice from "../ValidateMessageOnDevice";
import {
  renderWarningOutdated,
  renderConnectYourDevice,
  renderLoading,
  renderAllowOpeningApp,
  renderRequestQuitApp,
  renderRequiresAppInstallation,
  renderAllowManager,
  renderInWrongAppForAccount,
  renderError,
  renderDeviceNotOnboarded,
  renderBootloaderStep,
  renderExchange,
  renderConfirmSwap,
  LoadingAppInstall,
  AutoRepair,
  renderAllowLanguageInstallation,
  renderAllowRemoveCustomLockscreen,
  renderImageLoadRequested,
  renderLoadingImage,
  renderImageCommitRequested,
  RequiredFirmwareUpdate,
} from "./rendering";
import PreventNativeBack from "../PreventNativeBack";
import SkipLock from "../behaviour/SkipLock";
import DeviceActionProgress from "../DeviceActionProgress";
import { PartialNullable } from "~/types/helpers";
import ModalLock from "../ModalLock";

type LedgerError = InstanceType<LedgerErrorConstructor<{ [key: string]: unknown }>>;

type Status = PartialNullable<{
  appAndVersion: AppAndVersion;
  device: Device;
  unresponsive: boolean;
  isLocked: boolean;
  error: LedgerError & {
    name?: string;
    managerAppName?: string;
  };
  isLoading: boolean;
  allowManagerRequested: boolean;
  allowRenamingRequested: boolean;
  requestQuitApp: boolean;
  deviceInfo: DeviceInfo;
  requestOpenApp: string;
  allowOpeningRequestedWording: string;
  requiresAppInstallation: {
    appName: string;
    appNames: string[];
  };
  inWrongDeviceForAccount: {
    accountName: string;
  };
  onRetry: () => void;
  repairModalOpened: {
    auto: boolean;
  };
  onAutoRepair: () => void;
  closeRepairModal: () => void;
  deviceSignatureRequested: boolean;
  deviceStreamingProgress: number;
  displayUpgradeWarning: boolean;
  passWarning: () => void;
  initSwapRequested: boolean;
  initSwapError: Error;
  initSwapResult: InitSwapResult | null;
  installingLanguage: boolean;
  languageInstallationRequested: boolean;
  imageRemoveRequested: boolean;
  signMessageRequested: AnyMessage;
  allowOpeningGranted: boolean;
  completeExchangeStarted: boolean;
  completeExchangeResult: Transaction;
  completeExchangeError: Error;
  installingApp: boolean;
  progress: number;
  listingApps: boolean;
  amountExpectedTo: string;
  estimatedFees: string;
  imageLoadRequested: boolean;
  loadingImage: boolean;
  imageLoaded: boolean;
  imageCommitRequested: boolean;
}>;

type Props<H extends Status, P> = {
  onResult?: (_: NonNullable<P>) => Promise<void> | void;
  onError?: (_: Error) => Promise<void> | void;
  renderOnResult?: (_: P) => JSX.Element | null;
  status: H;
  device: Device;
  payload?: P | null;
  onSelectDeviceLink?: () => void;
  analyticsPropertyFlow?: string;
  /*
   * Defines in what type of component this action will be rendered in.
   *
   * Used to adapt the UI to either a drawer or a view.
   */
};

export default function DeviceAction<R, H extends Status, P>({
  action,
  request,
  device: selectedDevice,
  ...props
}: Omit<Props<H, P>, "status"> & {
  action: Action<R, H, P>;
  request: R;
}): JSX.Element {
  const status = action?.useHook(selectedDevice, request);
  const payload = action?.mapResult(status);

  return (
    <DeviceActionDefaultRendering
      device={selectedDevice}
      status={status}
      request={request}
      payload={payload}
      {...props}
    />
  );
}

export function DeviceActionDefaultRendering<R, H extends Status, P>({
  onResult,
  onError,
  device: selectedDevice,
  renderOnResult,
  onSelectDeviceLink,
  analyticsPropertyFlow = "unknown",
  status,
  request,
  payload,
}: Props<H, P> & {
  request?: R;
}): JSX.Element | null {
  const { colors, dark } = useTheme();
  const {
    colors: { palette },
  } = useThemeFromStyledComponents();

  const dispatch = useDispatch();
  const theme: "dark" | "light" = dark ? "dark" : "light";
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const {
    appAndVersion,
    device,
    unresponsive,
    isLocked,
    error,
    isLoading,
    allowManagerRequested,
    allowRenamingRequested,
    requestQuitApp,
    deviceInfo,
    requestOpenApp,
    allowOpeningRequestedWording,
    requiresAppInstallation,
    inWrongDeviceForAccount,
    onRetry,
    repairModalOpened,
    onAutoRepair,
    closeRepairModal,
    deviceSignatureRequested,
    deviceStreamingProgress,
    displayUpgradeWarning,
    passWarning,
    initSwapRequested,
    initSwapError,
    initSwapResult,
    installingLanguage,
    languageInstallationRequested,
    imageRemoveRequested,
    signMessageRequested,
    allowOpeningGranted,
    completeExchangeStarted,
    completeExchangeResult,
    completeExchangeError,
    installingApp,
    progress,
    listingApps,
    imageLoadRequested,
    loadingImage,
    imageCommitRequested,
  } = status;

  useEffect(() => {
    if (deviceInfo && device) {
      dispatch(
        setLastSeenDeviceInfo({
          modelId: device!.modelId,
          deviceInfo,
          apps: [],
        }),
      );
    }
  }, [dispatch, device, deviceInfo]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (displayUpgradeWarning && appAndVersion) {
    return renderWarningOutdated({
      t,
      appName: appAndVersion.name,
      passWarning: passWarning!,
      navigation,
      colors,
      theme,
    });
  }

  if (repairModalOpened && repairModalOpened.auto) {
    return (
      <AutoRepair
        t={t}
        onDone={closeRepairModal!}
        device={device!}
        navigation={navigation}
        colors={colors}
        theme={theme}
      />
    );
  }

  if (requestQuitApp) {
    return renderRequestQuitApp({
      t,
      device: selectedDevice,
      colors,
      theme,
    });
  }

  if (installingLanguage) {
    return (
      <Flex>
        <Flex my={7}>
          <DeviceActionProgress progress={progress} />
        </Flex>
        <Flex mb={5}>
          <Text variant="h4">{t("deviceLocalization.installingLanguage")}</Text>
        </Flex>
        <ModalLock />
      </Flex>
    );
  }

  if (installingApp) {
    const appName = requestOpenApp;
    const props = {
      t,
      description: t("DeviceAction.installApp", {
        percentage: (progress! * 100).toFixed(0) + "%",
        appName,
      }),
      colors,
      theme,
      appName,
      analyticsPropertyFlow,
      request: request as AppRequest,
    };
    return <LoadingAppInstall {...props} />;
  }

  if (requiresAppInstallation) {
    const { appName, appNames: maybeAppNames } = requiresAppInstallation;
    const appNames = maybeAppNames?.length ? maybeAppNames : [appName];
    return renderRequiresAppInstallation({
      t,
      navigation,
      appNames,
      colors,
      theme,
    });
  }
  if (allowManagerRequested) {
    return renderAllowManager({
      t,
      device: selectedDevice,
      colors,
      theme,
    });
  }

  if (allowRenamingRequested) {
    return renderAllowManager({
      t,
      device: selectedDevice,
      colors,
      theme,
      requestType: "rename",
    });
  }

  if (languageInstallationRequested) {
    return renderAllowLanguageInstallation({
      t,
      theme,
      device: selectedDevice,
    });
  }

  // FIXME when we rework the error rendering, this should be handled at that
  // level instead of being an exception here.
  if (imageRemoveRequested) {
    if (error) {
      const refused = (error as Status["error"]) instanceof UserRefusedOnDevice;
      const noImage = (error as Status["error"]) instanceof ImageDoesNotExistOnDevice;
      if (refused || noImage) {
        return renderError({
          t,
          navigation,
          error,
          onRetry: refused ? onRetry : undefined,
          colors,
          theme,
          hasExportLogButton: false,
          Icon: Icons.InformationFill,
          iconColor: palette.primary.c80,
          device: device ?? undefined,
        });
      }
    } else {
      return renderAllowRemoveCustomLockscreen({
        t,
        theme,
        device: selectedDevice,
      });
    }
  }

  if (listingApps) {
    return renderLoading({
      t,
      description: t("DeviceAction.listApps"),
      colors,
      theme,
    });
  }

  if (completeExchangeStarted && !completeExchangeResult && !completeExchangeError) {
    return renderExchange({
      exchangeType: (request as { exchangeType: number })?.exchangeType,
      t,
      device: device!,
      theme,
    });
  }

  if (initSwapRequested && !initSwapResult && !initSwapError) {
    const req = request as {
      device: Device;
      transaction: Transaction;
      exchangeRate: ExchangeRate;
      exchange: Exchange;
      amountExpectedTo?: string;
      estimatedFees?: string;
    };
    return renderConfirmSwap({
      t,
      device: selectedDevice,
      colors,
      theme,
      transaction: req?.transaction,
      exchangeRate: req?.exchangeRate,
      exchange: req?.exchange,
      amountExpectedTo: status.amountExpectedTo,
      estimatedFees: status.estimatedFees,
    });
  }

  if (allowOpeningRequestedWording || requestOpenApp) {
    // requestOpenApp for Nano S 1.3.1 (need to ask user to open the app.)
    const wording = allowOpeningRequestedWording || requestOpenApp;
    return renderAllowOpeningApp({
      t,
      navigation,
      device: selectedDevice,
      wording: wording!,
      tokenContext: (request as { tokenCurrency?: TokenCurrency })?.tokenCurrency,
      isDeviceBlocker: !requestOpenApp,
      colors,
      theme,
    });
  }

  if (inWrongDeviceForAccount) {
    return renderInWrongAppForAccount({
      t,
      onRetry,
      colors,
      theme,
    });
  }

  if (imageLoadRequested && device) {
    return renderImageLoadRequested({ t, device });
  }
  if (loadingImage && device && typeof progress === "number") {
    return renderLoadingImage({ t, device, progress });
  }
  if (imageCommitRequested && device) {
    return renderImageCommitRequested({ t, device });
  }

  if (!isLoading && error) {
    /** @TODO Put that back if the app is still crashing */
    // track("DeviceActionError", error);

    // NB Until we find a better way, remap the error if it's 6d06 (LNS, LNSP, LNX) or 6d07 (Stax) and we haven't fallen
    // into another handled case.
    if (
      device &&
      (error instanceof DeviceNotOnboarded ||
        ((error as unknown) instanceof TransportStatusError &&
          ((error as Error).message.includes("0x6d06") ||
            (error as Error).message.includes("0x6d07"))))
    ) {
      return renderDeviceNotOnboarded({ t, device, navigation });
    }

    if (error instanceof LatestFirmwareVersionRequired) {
      return <RequiredFirmwareUpdate t={t} navigation={navigation} device={selectedDevice} />;
    }

    if ((error as Status["error"]) instanceof UserRefusedDeviceNameChange) {
      return renderError({
        t,
        navigation,
        error,
        onRetry,
        colors,
        theme,
        iconColor: "warning.c60",
        Icon: Icons.WarningFill,
        device: device ?? undefined,
      });
    }

    return renderError({
      t,
      navigation,
      error,
      managerAppName:
        (error as Status["error"])?.name === "UpdateYourApp"
          ? (error as Status["error"])?.managerAppName
          : undefined,
      onRetry,
      colors,
      theme,
      device: device ?? undefined,
    });
  }

  if ((!isLoading && !device) || unresponsive || isLocked) {
    return renderConnectYourDevice({
      t,
      device: selectedDevice,
      unresponsive,
      isLocked: isLocked === null ? undefined : isLocked,
      colors,
      theme,
      onSelectDeviceLink,
    });
  }

  if (isLoading || (allowOpeningGranted && !appAndVersion)) {
    return renderLoading({
      t,
      colors,
      theme,
    });
  }

  if (deviceInfo && deviceInfo.isBootloader) {
    return renderBootloaderStep({
      onAutoRepair: onAutoRepair!,
      t,
    });
  }

  if (request && device && deviceSignatureRequested) {
    const { account, parentAccount, status, transaction } =
      request as unknown as React.ComponentProps<typeof ValidateOnDevice>;

    if (account && status && transaction) {
      navigation.setOptions({
        headerLeft: undefined,
        headerRight: undefined,
        gestureEnabled: false,
      });
      return (
        <>
          <PreventNativeBack />
          <SkipLock />
          <ValidateOnDevice
            device={device}
            account={account}
            parentAccount={parentAccount}
            transaction={transaction}
            status={status}
          />
        </>
      );
    }
  }

  if (request && device && signMessageRequested) {
    const { account } = request as unknown as { account: AccountLike };
    return (
      <>
        <PreventNativeBack />
        <SkipLock />
        <ValidateMessageOnDevice device={device} account={account} message={signMessageRequested} />
      </>
    );
  }

  if (typeof deviceStreamingProgress === "number") {
    return renderLoading({
      t,
      description:
        deviceStreamingProgress > 0
          ? t("send.verification.streaming.accurate", {
              percentage: (deviceStreamingProgress * 100).toFixed(0) + "%",
            })
          : t("send.verification.streaming.inaccurate"),
      colors,
      theme,
      lockModal: true,
    });
  }

  if (!payload) {
    return null;
  }

  if (onResult) {
    return <RenderOnResultCallback onResult={onResult} payload={payload} />;
  }

  if (renderOnResult) {
    return renderOnResult(payload);
  }

  return null;
} // work around for not updating state inside scope of main function with a callback

const RenderOnResultCallback = <P,>({
  onResult,
  payload,
}: {
  onResult: ((_: NonNullable<P>) => void | Promise<void>) | undefined;
  payload: NonNullable<P>;
}) => {
  // onDidMount
  useEffect(() => {
    onResult && onResult(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};
