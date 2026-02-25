/* eslint-disable @typescript-eslint/no-deprecated */
import React, { Fragment, useCallback, useContext, useEffect } from "react";
import { useNavigate } from "react-router";
import { connect } from "react-redux";
import { useDispatch } from "LLD/hooks/redux";
import { Trans, useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import styled from "styled-components";
import { BigNumber } from "bignumber.js";

import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import {
  Button as ButtonV3,
  Flex,
  IconsLegacy,
  InfiniteLoader,
  ProgressLoader,
  Text,
  Theme,
} from "@ledgerhq/react-ui";
import {
  FirmwareNotRecognized,
  LockedDeviceError,
  UpdateYourApp,
  LatestFirmwareVersionRequired,
  WrongDeviceForAccount,
  DisconnectedDevice,
  UnsupportedFeatureError,
} from "@ledgerhq/errors";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { ExchangeRate, ExchangeSwap } from "@ledgerhq/live-common/exchange/swap/types";
import { getNoticeType, getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { CompleteExchangeError } from "@ledgerhq/live-common/exchange/error";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  DeviceNotOnboarded,
  NoSuchAppOnProvider,
  TransactionRefusedOnDevice,
} from "@ledgerhq/live-common/errors";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { isSyncOnboardingSupported } from "@ledgerhq/live-common/device/use-cases/screenSpecs";
import { isDmkError } from "@ledgerhq/live-common/deviceSDK/tasks/core";
import { accountNameSelector, WalletState } from "@ledgerhq/live-wallet/store";
import { DmkError, isInvalidGetFirmwareMetadataResponseError } from "@ledgerhq/live-dmk-desktop";
import { isDisconnectedWhileSendingApduError } from "@ledgerhq/live-dmk-desktop";

import { urls } from "~/config/urls";
import { closeAllModal } from "~/renderer/actions/modals";
import { closePlatformAppDrawer } from "~/renderer/actions/UI";
import { track } from "~/renderer/analytics/segment";
import TrackPage, { setTrackingSource } from "~/renderer/analytics/TrackPage";
import Animation from "~/renderer/animations";
import Button, { Base as ButtonBase } from "~/renderer/components/Button";
import TranslatedError from "~/renderer/components/TranslatedError";
import Box from "~/renderer/components/Box";
import Alert from "~/renderer/components/Alert";
import ConnectTroubleshooting from "~/renderer/components/ConnectTroubleshooting";
import ExportLogsButton from "~/renderer/components/ExportLogsButton";
import ErrorIcon from "~/renderer/components/ErrorIcon";
import CurrencyUnitValue from "~/renderer/components/CurrencyUnitValue";
import { Rotating } from "~/renderer/components/Spinner";
import ProgressCircle from "~/renderer/components/ProgressCircle";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import DeviceIllustration from "~/renderer/components/DeviceIllustration";
import Image from "~/renderer/components/Image";
import ProviderIcon from "~/renderer/components/ProviderIcon";
import ExternalLinkButton from "../ExternalLinkButton";
import { ErrorBody } from "../ErrorBody";
import LinkWithExternalIcon from "../LinkWithExternalIcon";
import { context, setDrawer } from "~/renderer/drawers/Provider";
import IconTriangleWarning from "~/renderer/icons/TriangleWarning";
import CrossCircle from "~/renderer/icons/CrossCircle";
import Nano from "~/renderer/images/nanoS.v4.svg";
import { openURL } from "~/renderer/linking";
import Installing from "~/renderer/modals/UpdateFirmwareModal/Installing";
import { currencySettingsLocaleSelector, SettingsState } from "~/renderer/reducers/settings";
import { DrawerFooter } from "~/renderer/screens/exchange/Swap2/Form/DrawerFooter";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

import { getDeviceAnimation } from "./animations";
import { DeviceBlocker } from "./DeviceBlocker";
import NoSuchAppOnProviderErrorComponent from "./NoSuchAppOnProviderErrorComponent";
import { UnsupportedFeatureErrorComponent } from "./UnsupportedFeatureErrorComponent";

export const AnimationWrapper = styled.div`
  max-width: 600px;
  width: fit-content;
  overflow: hidden;
  padding-bottom: 12px;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
`;

const ProgressWrapper = styled.div`
  padding: 24px;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  max-width: 100%;
  margin: auto;
`;

export const ConfirmWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
  min-height: 260px;
  max-width: 100%;
`;

const Logo = styled.div<{ warning?: boolean; info?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${p =>
    p.info
      ? p.theme.colors.primary.c80
      : p.warning
        ? p.theme.colors.legacyWarning
        : p.theme.colors.alertRed};
`;

export const Header = styled.div`
  display: flex;
  flex: 1 0 0%;
  flex-direction: column;
  justify-content: flex-end;
  align-content: center;
  align-items: center;
`;

export const Footer = styled.div`
  display: flex;
  flex: 1 0 0%;
  flex-direction: column;
  justify-content: flex-start;
  align-content: center;
  align-items: center;
`;

export const Title = styled(Text).attrs({
  fontWeight: "semiBold",
  color: "neutral.c100",
  textAlign: "center",
  fontSize: 6,
})`
  white-space: pre-line;
`;

const BulletText = styled(Text).attrs({
  variant: "body",
  fontWeight: "medium",
  textAlign: "start",
  whiteSpace: "pre-line",
})``;

export const SubTitle = styled(Text).attrs({
  variant: "paragraph",
  color: "neutral.c100",
  textAlign: "center",
  fontSize: 3,
})`
  margin-top: 8px;
`;

/**
 * @deprecated use ErrorBody or its exported
 * ErrorTitle instead (up to date v3 design)
 * */
const ErrorTitle = styled(Text).attrs({
  variant: "paragraph",
  fontWeight: "semiBold",
  color: "neutral.c100",
  textAlign: "center",
  fontSize: 6,
})`
  user-select: text;
  margin-bottom: 10px;
  margin-top: 20px;
`;

/**
 * @deprecated use ErrorBody or its exported
 * ErrorTitle instead (up to date v3 design)
 * */
const ErrorDescription = styled(Text).attrs({
  variant: "paragraph",
  color: "neutral.c70",
  textAlign: "center",
  fontSize: 4,
  whiteSpace: "pre-wrap",
})`
  user-select: text;
`;

const ButtonContainer = styled(Box).attrs(({ theme }) => ({
  mt: 25,
  horizontal: false,
  alignItems: "center",
  justifyContent: "center",
  gap: `${theme.space[4]}px`,
}))<{ stretch?: boolean }>`
  ${({ stretch }) => stretch && "align-self: stretch;"}
`;

const ButtonGroup = styled(Box).attrs(({ theme }) => ({
  horizontal: true,
  alignItems: "stretch",
  justifyContent: "center",
  gap: `${theme.space[4]}px`,
}))`
  align-self: stretch;

  ${ButtonBase} {
    flex: 1 0 0;
    justify-content: center;
  }
`;

const TroubleshootingWrapper = styled.div`
  margin-top: auto;
  margin-bottom: 16px;
`;

const Circle = styled(Flex)`
  height: 40px;
  width: 40px;
  border-radius: 40px;
  background: ${p => p.theme.colors.opacityDefault.c10};
  align-items: center;
  justify-content: center;
`;

const Separator = styled.div`
  width: calc(100% + 60px);
  height: 1px;
  background-color: ${({ theme }) => theme.colors.neutral.c30};
  margin: 24px -30px;
`;

const DeviceSwapSummaryStyled = styled.section`
  margin: ${({ theme }) => theme.space[3]}px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: ${({ theme }) => theme.space[4]}px;
`;

const DeviceSwapSummaryValueStyled = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  color: ${({ theme }) => theme.colors.neutral.c100};
  font-size: 14px;
  justify-self: flex-end;
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
`;

const DeviceSwapSummaryContainer = styled(Flex)`
  margin: ${({ theme }) => theme.space[3]}px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  padding: ${({ theme }) => theme.space[6]}px;
`;

const EllipsesTextStyled = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  display: inline-block;
  max-width: 100%;
`;

const ButtonFooter = styled(Footer)`
  width: 100%;
  margin-top: 46px;
`;

// these are not components because we want reconciliation to not remount the sub elements

export const renderRequestQuitApp = ({
  modelId,
  type,
}: {
  modelId: DeviceModelId;
  type: Theme["theme"];
}) => (
  <Wrapper>
    <Header />
    <AnimationWrapper>
      <Animation animation={getDeviceAnimation(modelId, type, "quitApp")} />
    </AnimationWrapper>
    <Footer>
      <Title>
        <Trans i18nKey="DeviceAction.quitApp" />
      </Title>
    </Footer>
  </Wrapper>
);

export const renderVerifyUnwrapped = ({
  modelId,
  type,
}: {
  modelId: DeviceModelId;
  type: Theme["theme"];
}) => (
  <AnimationWrapper>
    <DeviceBlocker />
    <Animation animation={getDeviceAnimation(modelId, type, "verify")} />
  </AnimationWrapper>
);

const OpenManagerBtn = ({
  closeAllModal,
  closePlatformAppDrawer,
  appName,
  updateApp,
  firmwareUpdate,
  mt = 2,
  ml = 0,
}: {
  closeAllModal: () => void;
  closePlatformAppDrawer: () => void;
  appName?: string;
  updateApp?: boolean;
  firmwareUpdate?: boolean;
  mt?: number;
  ml?: number;
}) => {
  const navigate = useNavigate();
  const { setDrawer } = useContext(context);

  const onClick = useCallback(() => {
    const urlParams = new URLSearchParams({
      updateApp: updateApp ? "true" : "false",
      firmwareUpdate: firmwareUpdate ? "true" : "false",
      ...(appName ? { q: appName } : {}),
    });
    const search = urlParams.toString();
    setTrackingSource("device action open manager button");
    navigate(`/manager${search ? `?${search}` : ""}`);
    closeAllModal();
    closePlatformAppDrawer();
    setDrawer(undefined);
  }, [
    updateApp,
    firmwareUpdate,
    appName,
    navigate,
    closeAllModal,
    closePlatformAppDrawer,
    setDrawer,
  ]);

  return (
    <Button mt={mt} ml={ml} primary onClick={onClick}>
      <Trans i18nKey="DeviceAction.openManager" />
    </Button>
  );
};

const OpenOnboardingBtn = () => {
  const { setDrawer } = useContext(context);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onClick = useCallback(() => {
    setTrackingSource("device action open onboarding button");
    dispatch(closeAllModal());
    setDrawer(undefined);
    navigate("/onboarding");
  }, [dispatch, navigate, setDrawer]);

  return (
    <Button primary onClick={onClick}>
      <Trans i18nKey="DeviceAction.openOnboarding" />
    </Button>
  );
};

const OpenManagerButton = connect(null, {
  closeAllModal,
  closePlatformAppDrawer,
})(OpenManagerBtn);

export const renderRequiresAppInstallation = ({ appNames }: { appNames: string[] }) => {
  const appNamesCSV = appNames.join(", ");
  return (
    <Wrapper>
      <Logo>
        <CrossCircle size={44} />
      </Logo>
      <ErrorTitle>
        <Trans i18nKey="DeviceAction.appNotInstalledTitle" count={appNames.length} />
      </ErrorTitle>
      <ErrorDescription>
        <Trans
          i18nKey="DeviceAction.appNotInstalled"
          values={{ appName: appNamesCSV }}
          count={appNames.length}
        />
      </ErrorDescription>
      <Box mt={24}>
        <OpenManagerButton appName={appNamesCSV} />
      </Box>
    </Wrapper>
  );
};

export const InstallingApp = ({
  modelId,
  type,
  appName,
  progress,
  request,
  analyticsPropertyFlow = "unknown",
}: {
  modelId: DeviceModelId;
  type: Theme["theme"];
  appName: string;
  progress: number;
  request: {
    currency?: CryptoCurrency;
    account?: Account;
    appName?: string;
  };
  analyticsPropertyFlow?: string;
}) => {
  const currency = request?.currency || request?.account?.currency;
  const appNameToTrack = appName || request?.appName || currency?.managerAppName;
  const cleanProgress = progress ? Math.round(progress * 100) : null;
  useEffect(() => {
    track("In-line app install", { appName: appNameToTrack, flow: analyticsPropertyFlow });
  }, [appNameToTrack, analyticsPropertyFlow]);
  return (
    <Wrapper data-testid="device-action-loader">
      <Header />
      <AnimationWrapper>
        <Animation animation={getDeviceAnimation(modelId, type, "installLoading")} />
      </AnimationWrapper>
      <Footer>
        <Title>
          <Trans i18nKey="DeviceAction.installApp" values={{ appName }} />
        </Title>
        <SubTitle>
          <Trans i18nKey="DeviceAction.installAppDescription" />
        </SubTitle>
        {cleanProgress ? <Title>{`${cleanProgress}%`}</Title> : null}
      </Footer>
    </Wrapper>
  );
};

export const renderInstallingLanguage = ({ progress, t }: { progress: number; t: TFunction }) => {
  return (
    <Flex
      flex={1}
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      data-testid="installing-language-progress"
    >
      <Box my={5} alignItems="center">
        <Flex alignItems="center" justifyContent="center" borderRadius={9999} size={60} mb={5}>
          <ProgressLoader
            stroke={8}
            infinite={!progress}
            progress={progress * 100}
            showPercentage={true}
          />
        </Flex>
        <Title>{t("deviceLocalization.installingLanguage")}</Title>
      </Box>
    </Flex>
  );
};

export const renderListingApps = () => (
  <Wrapper data-testid="device-action-loader">
    <Header />
    <ProgressWrapper>
      <Rotating size={58}>
        <ProgressCircle hideProgress size={58} progress={0.06} />
      </Rotating>
    </ProgressWrapper>
    <Footer>
      <Title>
        <Trans i18nKey="DeviceAction.listApps" />
      </Title>
      <SubTitle>
        <Trans i18nKey="DeviceAction.listAppsDescription" />
      </SubTitle>
    </Footer>
  </Wrapper>
);

export const renderAllowManager = ({
  modelId,
  type,
  requestType = "manager",
}: {
  modelId: DeviceModelId;
  type: Theme["theme"];
  requestType?: "manager" | "rename";
}) => {
  const productName = getDeviceModel(modelId).productName;
  return (
    <Wrapper>
      <DeviceBlocker />
      <Header />
      <AnimationWrapper>
        <Animation animation={getDeviceAnimation(modelId, type, "allowManager")} />
      </AnimationWrapper>
      <Footer>
        <Title>
          {requestType === "rename" ? (
            <Trans i18nKey="DeviceAction.allowRenaming" />
          ) : (
            <Trans i18nKey="DeviceAction.allowManagerPermission" values={{ productName }} />
          )}
        </Title>
      </Footer>
    </Wrapper>
  );
};

export const renderAllowLanguageInstallation = ({
  modelId,
  type,
  t,
}: {
  modelId: DeviceModelId;
  type: Theme["theme"];
  t: TFunction;
}) => (
  <Flex
    flex={1}
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    data-testid="allow-language-installation"
  >
    <DeviceBlocker />
    <AnimationWrapper>
      <Animation animation={getDeviceAnimation(modelId, type, "allowManager")} />
    </AnimationWrapper>
    <Flex justifyContent="center" mt={2}>
      <Title>{t(`deviceLocalization.allowLanguageInstallation`)}</Title>
    </Flex>
  </Flex>
);

export const renderAllowRemoveCustomLockscreen = ({
  modelId,
  type,
}: {
  modelId: DeviceModelId;
  type: Theme["theme"];
}) => (
  <Wrapper>
    <DeviceBlocker />
    <Header />
    <AnimationWrapper>
      <Animation animation={getDeviceAnimation(modelId, type, "verify")} />
    </AnimationWrapper>
    <Footer>
      <Title>
        <Trans
          i18nKey="removeCustomLockscreen.confirmation"
          values={{ productName: getDeviceModel(modelId).productName }}
        />
      </Title>
    </Footer>
  </Wrapper>
);

export const renderAllowOpeningApp = ({
  modelId,
  type,
  wording,
  tokenContext,
  isDeviceBlocker,
}: {
  modelId: DeviceModelId;
  type: Theme["theme"];
  wording: string;
  tokenContext?: TokenCurrency;
  isDeviceBlocker?: boolean;
}) => (
  <Wrapper>
    {isDeviceBlocker ? <DeviceBlocker /> : null}
    <Header />
    <AnimationWrapper>
      <Animation animation={getDeviceAnimation(modelId, type, "openApp")} />
    </AnimationWrapper>
    <Footer>
      <Title>
        <Trans i18nKey="DeviceAction.allowAppPermission" values={{ wording }} />
        {!tokenContext ? null : (
          <>
            {"\n"}
            <Trans
              i18nKey="DeviceAction.allowAppPermissionSubtitleToken"
              values={{ token: tokenContext.name }}
            />
          </>
        )}
      </Title>
    </Footer>
  </Wrapper>
);

export const renderWarningOutdated = ({
  passWarning,
  appName,
}: {
  passWarning: () => void;
  appName: string;
}) => (
  <Wrapper id={`warning-outdated-app`}>
    <Logo warning>
      <IconTriangleWarning size={44} />
    </Logo>
    <ErrorTitle>
      <Trans i18nKey="DeviceAction.outdated" />
    </ErrorTitle>
    <ErrorDescription>
      <Trans i18nKey="DeviceAction.outdatedDesc" values={{ appName }} />
    </ErrorDescription>
    <ButtonContainer>
      <Button onClick={passWarning}>
        <Trans i18nKey="common.continue" />
      </Button>
      <OpenManagerButton ml={4} mt={0} appName={appName} updateApp />
    </ButtonContainer>
  </Wrapper>
);

// Quick fix: the tmpError LockedDeviceError should be catched
// inside all the device actions and mapped to an event of type "lockedDevice".
// With this fix, we can catch all the device action tmpError that were not catched upstream.
// If LockedDeviceError is thrown from outside a device action and renderError was not called
// it is still handled by GenericErrorView.
export const renderLockedDeviceError = ({
  t,
  device,
  onRetry,
  inlineRetry,
}: {
  t: TFunction;
  device?: Device | null;
  onRetry?: (() => void) | null | undefined;
  inlineRetry?: boolean;
}) => {
  const productName = device ? getDeviceModel(device.modelId).productName : null;

  return (
    <Wrapper id="error-locked-device">
      <ErrorBody
        Icon={IconsLegacy.LockAltMedium}
        title={t("errors.LockedDeviceError.title")}
        description={
          productName
            ? t("errors.LockedDeviceError.descriptionWithProductName", {
                productName,
              })
            : t("errors.LockedDeviceError.description")
        }
        buttons={
          onRetry && inlineRetry ? (
            <ButtonV3 size="large" variant="main" onClick={onRetry}>
              {t("common.retry")}
            </ButtonV3>
          ) : null
        }
      />
    </Wrapper>
  );
};

export const DeviceNotOnboardedErrorComponent = withV3StyleProvider(
  ({ t, device }: { t: TFunction; device?: Device | null }) => {
    const productName = device ? getDeviceModel(device.modelId).productName : null;
    const navigate = useNavigate();
    const { setDrawer } = useContext(context);
    const dispatch = useDispatch();

    const redirectToOnboarding = useCallback(() => {
      setTrackingSource("device action open onboarding button");
      dispatch(closeAllModal());
      setDrawer(undefined);
      if (!device?.modelId) {
        navigate("/onboarding");
      } else {
        navigate(
          isSyncOnboardingSupported(device.modelId)
            ? `/sync-onboarding/${device.modelId}`
            : "/onboarding",
        );
      }
    }, [device?.modelId, dispatch, navigate, setDrawer]);

    return (
      <Wrapper id="error-device-not-onboarded">
        <ErrorBody
          top={device ? <DeviceIllustration size={120} deviceId={device.modelId} /> : null}
          title={t("errors.DeviceNotOnboardedDAError.title")}
          description={t("errors.DeviceNotOnboardedDAError.description")}
          buttons={
            <ButtonV3
              variant="main"
              size="large"
              onClick={redirectToOnboarding}
              Icon={IconsLegacy.ArrowRightMedium}
            >
              {productName
                ? t("errors.DeviceNotOnboardedDAError.goToOnboardingButtonWithProductName", {
                    productName,
                  })
                : t("errors.DeviceNotOnboardedDAError.goToOnboardingButton")}
            </ButtonV3>
          }
        />
      </Wrapper>
    );
  },
);

const FirmwareNotRecognizedErrorComponent: React.FC<{
  onRetry?: (() => void) | null | undefined;
}> = ({ onRetry }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const goToExperimentalSettings = () => {
    setDrawer();
    dispatch(closeAllModal());
    navigate("/settings/experimental");
  };
  return (
    <Wrapper>
      <ErrorBody
        Icon={IconsLegacy.InfoAltFillMedium}
        iconColor="primary.c80"
        title={t("errors.FirmwareNotRecognized.title")}
        description={t("errors.FirmwareNotRecognized.description")}
        buttons={
          <>
            <ButtonV3 size="large" variant="main" onClick={goToExperimentalSettings}>
              {t("errors.FirmwareNotRecognized.goToSettingsCTA")}
            </ButtonV3>
            {onRetry ? (
              <ButtonV3 size="large" variant="shade" onClick={onRetry}>
                {t("common.retry")}
              </ButtonV3>
            ) : null}
          </>
        }
      />
    </Wrapper>
  );
};

export const renderError = ({
  error,
  t,
  withOpenManager,
  onRetry,
  withExportLogs,
  list,
  supportLink,
  buyLedger,
  warning,
  info,
  managerAppName,
  requireFirmwareUpdate,
  withOnboardingCTA,
  device,
  inlineRetry = true,
  withDescription = true,
  learnMoreLink,
  learnMoreTextKey,
  Icon,
  stretch,
}: {
  error: Error | ErrorConstructor | DmkError;
  t: TFunction;
  withOpenManager?: boolean;
  onRetry?: (() => void) | null | undefined;
  withExportLogs?: boolean;
  list?: boolean;
  supportLink?: string;
  learnMoreLink?: string;
  learnMoreTextKey?: string;
  buyLedger?: string;
  warning?: boolean;
  info?: boolean;
  managerAppName?: string;
  requireFirmwareUpdate?: boolean;
  withOnboardingCTA?: boolean;
  device?: Device | null;
  inlineRetry?: boolean;
  withDescription?: boolean;
  stretch?: boolean;
  Icon?: (props: { color?: string | undefined; size?: number | undefined }) => React.JSX.Element;
}) => {
  let tmpError = error;
  // Redirects from renderError and not from DeviceActionDefaultRendering because renderError
  // can be used directly by other component
  if (tmpError instanceof LockedDeviceError) {
    return renderLockedDeviceError({ t, onRetry, device, inlineRetry });
  } else if (tmpError instanceof DeviceNotOnboarded) {
    return <DeviceNotOnboardedErrorComponent t={t} device={device} />;
  } else if (
    tmpError instanceof FirmwareNotRecognized ||
    isInvalidGetFirmwareMetadataResponseError(tmpError)
  ) {
    return <FirmwareNotRecognizedErrorComponent onRetry={onRetry} />;
  } else if (tmpError instanceof CompleteExchangeError) {
    if (tmpError.title === "userRefused") {
      tmpError = new TransactionRefusedOnDevice();
    }
  } else if (tmpError instanceof NoSuchAppOnProvider) {
    return (
      <NoSuchAppOnProviderErrorComponent
        error={tmpError}
        productName={getDeviceModel(device?.modelId as DeviceModelId)?.productName}
        learnMoreLink={learnMoreLink}
        learnMoreTextKey={learnMoreTextKey}
      />
    );
  } else if (tmpError instanceof UnsupportedFeatureError) {
    return <UnsupportedFeatureErrorComponent />;
  } else if (isDisconnectedWhileSendingApduError(tmpError)) {
    tmpError = new DisconnectedDevice();
  }

  const supportLinkUrl = supportLink ?? urls.errors[isDmkError(error) ? error._tag : error?.name];

  return (
    <Wrapper id={`error-${isDmkError(error) ? error._tag : error.name}`}>
      {requireFirmwareUpdate ? (
        <TrackPage category="Firmware Update" name="Error: App Unavailable Update Firmware" />
      ) : null}
      <ErrorBody
        Icon={
          Icon
            ? Icon
            : () => (
                <Logo info={info} warning={warning}>
                  <ErrorIcon size={24} error={error} />
                </Logo>
              )
        }
        title={<TranslatedError error={tmpError as unknown as Error} noLink />}
        description={
          withDescription && (
            <TranslatedError
              dataTestId="error-description-deviceAction"
              error={tmpError as unknown as Error}
              field="description"
            />
          )
        }
        list={
          list ? (
            <ol style={{ textAlign: "justify" }}>
              <TranslatedError error={tmpError as unknown as Error} field="list" />
            </ol>
          ) : undefined
        }
      />
      <ButtonContainer stretch={stretch}>
        {managerAppName || requireFirmwareUpdate ? (
          <OpenManagerButton
            appName={managerAppName}
            updateApp={tmpError instanceof UpdateYourApp}
            firmwareUpdate={tmpError instanceof LatestFirmwareVersionRequired}
          />
        ) : (
          <>
            <ButtonGroup>
              {withExportLogs ? (
                <ExportLogsButton
                  title={t("settings.exportLogs.title")}
                  small={false}
                  primary={false}
                  outlineGrey
                />
              ) : null}
              {withOpenManager ? (
                <OpenManagerButton mt={0} />
              ) : onRetry && inlineRetry ? (
                <Button primary onClick={onRetry}>
                  {t("common.retry")}
                </Button>
              ) : null}
              {withOnboardingCTA ? <OpenOnboardingBtn /> : null}
              {buyLedger ? (
                <LinkWithExternalIcon
                  label={t("common.buyLedger")}
                  onClick={() => openURL(buyLedger)}
                />
              ) : null}
            </ButtonGroup>
            {supportLinkUrl ? (
              <ExternalLinkButton label={t("common.getSupport")} url={supportLinkUrl} />
            ) : null}
          </>
        )}
      </ButtonContainer>
    </Wrapper>
  );
};

export const renderInWrongAppForAccount = ({
  t,
  onRetry,
}: {
  t: TFunction;
  onRetry?: (() => void) | null | undefined;
}) =>
  renderError({
    t,
    error: new WrongDeviceForAccount(""),
    withExportLogs: true,
    onRetry,
    stretch: true,
  });

export const renderConnectYourDevice = ({
  modelId,
  type,
  onRepairModal,
  device,
  unresponsive,
}: {
  modelId: DeviceModelId;
  type: Theme["theme"];
  onRepairModal?: ((open: boolean) => void) | null;
  device: Device;
  unresponsive?: boolean | null;
}) => (
  <Wrapper>
    <Header />
    <AnimationWrapper>
      <Animation animation={getDeviceAnimation(modelId, type, "enterPinCode")} />
    </AnimationWrapper>
    <Footer>
      <Title>
        <Trans
          i18nKey={
            unresponsive ? "DeviceAction.unlockDevice" : "DeviceAction.connectAndUnlockDevice"
          }
        />
      </Title>
      {!device && onRepairModal ? (
        <TroubleshootingWrapper>
          <ConnectTroubleshooting onRepair={onRepairModal} />
        </TroubleshootingWrapper>
      ) : null}
    </Footer>
  </Wrapper>
);

const OpenSwapBtn = () => {
  const { setDrawer } = useContext(context);
  const dispatch = useDispatch();

  const onClick = () => {
    setTrackingSource("device action open swap button");
    dispatch(closePlatformAppDrawer());
    setDrawer(undefined);
  };

  return (
    <ButtonV3
      variant="main"
      outline
      size="large"
      width="calc(100% - 80px)"
      ml="40px"
      mr="40px"
      onClick={onClick}
    >
      <Trans i18nKey={"swap.wrongDevice.changeProvider"} />
    </ButtonV3>
  );
};

export const HardwareUpdate = ({
  i18nKeyTitle,
  i18nKeyDescription,
  i18nKeyValues,
}: {
  i18nKeyTitle: string;
  i18nKeyDescription: string;
  i18nKeyValues?: Record<string, string>;
}) => (
  <Wrapper>
    <Header>
      <Image resource={Nano} alt="NanoS" style={{ marginBottom: 40 }} />
    </Header>
    <Flex alignItems="center" flexDirection="column" rowGap="16px" mr="40px" ml="40px">
      <Title variant="body" color="neutral.c100">
        <Trans i18nKey={i18nKeyTitle} values={i18nKeyValues} />
      </Title>
      <Text variant="body" color="neutral.c70" textAlign="center">
        <Trans i18nKey={i18nKeyDescription} values={i18nKeyValues} />
      </Text>
    </Flex>
    <ButtonFooter>
      <ButtonContainer width="100%">
        <ButtonV3
          variant="main"
          size="large"
          width="calc(100% - 80px)"
          ml="40px"
          mr="40px"
          onClick={() => {
            openURL("https://shop.ledger.com/pages/hardware-wallet");
          }}
        >
          <Trans i18nKey={"swap.wrongDevice.cta"} />
        </ButtonV3>
      </ButtonContainer>
      <ButtonContainer width="100%">
        <OpenSwapBtn />
      </ButtonContainer>
    </ButtonFooter>
  </Wrapper>
);

const renderFirmwareUpdatingBase = ({
  modelId,
  type,
  deviceHasPin,
  downloadPhase,
}: {
  modelId: DeviceModelId;
  type: Theme["theme"];
  deviceHasPin?: boolean;
  downloadPhase?: { current: number; total: number };
}) =>
  deviceHasPin ? (
    <Wrapper>
      <Header />
      <Box mb={8}>
        <Animation animation={getDeviceAnimation(modelId, type, "firmwareUpdating")} />
      </Box>
      <Footer>
        <Flex alignItems="flex-start" flexDirection="column">
          <Flex alignItems="center">
            <Circle mr={6}>
              <Text color="neutral.c100" variant="body">
                {"1"}
              </Text>
            </Circle>
            <BulletText flex={1}>
              <Trans
                i18nKey="DeviceAction.unlockDeviceAfterFirmwareUpdateStep1"
                values={{ productName: getDeviceModel(modelId).productName }}
              />
            </BulletText>
          </Flex>
          <Flex alignItems="center" mt={6}>
            <Circle mr={6}>
              <Text color="neutral.c100" variant="body">
                {"2"}
              </Text>
            </Circle>
            <BulletText flex={1}>
              <Trans
                i18nKey="DeviceAction.unlockDeviceAfterFirmwareUpdateStep2"
                values={{ productName: getDeviceModel(modelId).productName }}
              />
            </BulletText>
          </Flex>
        </Flex>
      </Footer>
    </Wrapper>
  ) : (
    <Installing
      isInstalling={!!(downloadPhase?.current && downloadPhase?.total)}
      current={downloadPhase?.current}
      total={downloadPhase?.total}
      deviceModelId={modelId}
    />
  );

export const renderFirmwareUpdating = withV3StyleProvider(renderFirmwareUpdatingBase);

interface SwapConfirmationProps {
  modelId: DeviceModelId;
  type: Theme["theme"];
  transaction: Transaction;
  exchangeRate: ExchangeRate;
  exchange: ExchangeSwap;
  amountExpectedTo?: string;
  estimatedFees?: string;
  swapDefaultTrack: Record<string, string | boolean>;
  stateSettings: SettingsState;
  walletState: WalletState;
}

const SwapConfirmationDetailedView: React.FC<{
  alertProperties: Record<string, unknown>;
  noticeType: { message: string };
  exchangeRate: { provider: string };
  deviceSwapSummaryFields: [string, React.ReactNode][];
  modelId: DeviceModelId;
  type: Theme["theme"];
}> = ({ alertProperties, noticeType, exchangeRate, deviceSwapSummaryFields, modelId, type }) => (
  <>
    <Box flex={0}>
      <Alert type="primary" {...alertProperties} mb={5} mx={4}>
        <Trans
          i18nKey={`DeviceAction.swap.notice.${noticeType.message}`}
          values={{ providerName: getProviderName(exchangeRate.provider) }}
        />
      </Alert>
    </Box>
    <DeviceSwapSummaryStyled data-testid="device-swap-summary">
      {deviceSwapSummaryFields.map(([key, value]) => (
        <Fragment key={key}>
          <Text fontWeight="medium" color="neutral.c60" fontSize="14px">
            <Trans i18nKey={`DeviceAction.swap2.${key}`} />
          </Text>
          <DeviceSwapSummaryValueStyled data-testid={key}>{value}</DeviceSwapSummaryValueStyled>
        </Fragment>
      ))}
    </DeviceSwapSummaryStyled>
    {renderVerifyUnwrapped({ modelId, type })}
  </>
);

const SwapConfirmationSimpleView: React.FC<{
  modelId: DeviceModelId;
  type: Theme["theme"];
  noticeType: { message: string };
}> = ({ modelId, type, noticeType }) => (
  <DeviceSwapSummaryContainer>
    {renderVerifyUnwrapped({ modelId, type })}
    <Text fontSize="24px" fontWeight="semiBold" textAlign="center">
      <Trans i18nKey="DeviceAction.swap.confirmSwap" />
    </Text>
    <Text color="neutral.c70" fontSize="14px" textAlign="center">
      <Trans i18nKey={`DeviceAction.swap.simpleViewNotice.${noticeType.message}`} />
    </Text>
  </DeviceSwapSummaryContainer>
);

const SwapDeviceConfirmation: React.FC<SwapConfirmationProps> = ({
  modelId,
  type,
  transaction,
  exchangeRate,
  exchange,
  amountExpectedTo,
  estimatedFees,
  swapDefaultTrack,
  stateSettings,
  walletState,
}) => {
  const ptxSwapDetailedView = useFeature("ptxSwapDetailedView");
  const isDetailedViewEnabled = !!ptxSwapDetailedView?.enabled;
  const variant = ptxSwapDetailedView?.params?.variant ?? ABTestingVariants.variantA;
  const variantViewName =
    variant === ABTestingVariants.variantA ? "ptxDrawerDetails" : "ptxNoDrawerDetails";
  const sourceAccountCurrency = exchange.fromCurrency;
  const targetAccountCurrency = exchange.toCurrency;

  const sourceAccountName =
    accountNameSelector(walletState, {
      accountId:
        "parentId" in exchange.fromAccount && exchange.fromAccount.parentId
          ? exchange.fromAccount.parentId
          : exchange.fromAccount.id,
    }) ?? sourceAccountCurrency.name;

  // If account exists already then grab the name set.
  // However if account has not yet been set then use the
  // crypto/token currency name as the target account.
  const targetAccountName =
    accountNameSelector(walletState, {
      accountId:
        "parentId" in exchange.toAccount && exchange.toAccount.parentId
          ? exchange.toAccount.parentId
          : exchange.toAccount.id,
    }) ?? targetAccountCurrency.name;

  const providerName = getProviderName(exchangeRate.provider);
  const noticeType = getNoticeType(exchangeRate.provider);
  const alertProperties = noticeType.learnMore ? { learnMoreUrl: urls.swap.learnMore } : {};

  const unitFromExchange = currencySettingsLocaleSelector(
    stateSettings,
    sourceAccountCurrency,
  ).unit;
  const unitToExchange = currencySettingsLocaleSelector(stateSettings, targetAccountCurrency).unit;
  const unitMainAccount = currencySettingsLocaleSelector(
    stateSettings,
    getMainAccount(exchange.fromAccount, exchange.fromParentAccount).currency,
  ).unit;

  const deviceSwapSummaryFields = Object.entries({
    amountSent: (
      <CurrencyUnitValue
        unit={unitFromExchange}
        value={transaction.amount}
        disableRounding
        showCode
        component={({ children }) => (
          <EllipsesTextStyled title={typeof children === "string" ? children : ""}>
            {children}
          </EllipsesTextStyled>
        )}
      />
    ),
    amountReceived: (
      <CurrencyUnitValue
        unit={unitToExchange}
        value={amountExpectedTo ? BigNumber(amountExpectedTo) : exchangeRate.toAmount}
        disableRounding
        showCode
        component={({ children }) => (
          <EllipsesTextStyled title={typeof children === "string" ? children : ""}>
            {children}
          </EllipsesTextStyled>
        )}
      />
    ),
    provider: (
      <>
        <ProviderIcon size="XXS" name={exchangeRate.provider} />
        <EllipsesTextStyled title={providerName}>{providerName}</EllipsesTextStyled>
      </>
    ),
    fees: (
      <CurrencyUnitValue
        unit={unitMainAccount}
        value={BigNumber(estimatedFees || 0)}
        disableRounding
        showCode
        component={({ children }) => (
          <EllipsesTextStyled title={typeof children === "string" ? children : ""}>
            {children}
          </EllipsesTextStyled>
        )}
      />
    ),
    sourceAccount: (
      <>
        {sourceAccountCurrency && <CryptoCurrencyIcon currency={sourceAccountCurrency} size={25} />}
        <EllipsesTextStyled textTransform={"capitalize"} title={sourceAccountName}>
          {sourceAccountName}
        </EllipsesTextStyled>
      </>
    ),
    targetAccount: (
      <>
        {targetAccountCurrency && <CryptoCurrencyIcon currency={targetAccountCurrency} size={25} />}
        <EllipsesTextStyled textTransform={"capitalize"} title={targetAccountName}>
          {targetAccountName}
        </EllipsesTextStyled>
      </>
    ),
  });

  return (
    <>
      <ConfirmWrapper>
        <TrackPage
          category="Swap"
          name={`ModalStep-summary`}
          sourcecurrency={sourceAccountCurrency?.name}
          targetcurrency={targetAccountCurrency?.name}
          provider={exchangeRate.provider}
          ptxSwapDetailedViewVariant={variantViewName}
          {...swapDefaultTrack}
        />
        {isDetailedViewEnabled ? (
          <SwapConfirmationDetailedView
            alertProperties={alertProperties}
            noticeType={noticeType}
            exchangeRate={exchangeRate}
            deviceSwapSummaryFields={deviceSwapSummaryFields}
            modelId={modelId}
            type={type}
          />
        ) : (
          <SwapConfirmationSimpleView modelId={modelId} type={type} noticeType={noticeType} />
        )}
      </ConfirmWrapper>
      <Separator />
      <DrawerFooter
        provider={exchangeRate.provider}
        sponsored={transaction.family === "evm" && transaction.sponsored}
      />
    </>
  );
};

export const renderSwapDeviceConfirmation = (props: SwapConfirmationProps) => (
  <SwapDeviceConfirmation {...props} />
);

export const renderSecureTransferDeviceConfirmation = ({
  exchangeType,
  modelId,
  type,
}: {
  exchangeType: "sell" | "fund";
  modelId: DeviceModelId;
  type: Theme["theme"];
}) => (
  <>
    <Box flex={0}>
      <Alert type="primary" learnMoreUrl={urls.swap.learnMore} horizontal={false}>
        <Trans i18nKey={`DeviceAction.${exchangeType}.notice`} />
      </Alert>
    </Box>
    {renderVerifyUnwrapped({ modelId, type })}
    <Box alignItems={"center"}>
      <Text textAlign="center" fontWeight="semiBold" color="neutral.c100" fontSize={5}>
        <Trans i18nKey={`DeviceAction.${exchangeType}.confirm`} />
      </Text>
    </Box>
  </>
);

export const renderLoading = ({ children }: { children?: React.ReactNode } = {}) => (
  <Wrapper data-testid="device-action-loader">
    <Header />
    <Flex alignItems="center" justifyContent="center" borderRadius={9999} size={60} mb={5}>
      <InfiniteLoader size={58} />
    </Flex>
    <Footer>
      <Title>{children || <Trans i18nKey="DeviceAction.loading" />}</Title>
    </Footer>
  </Wrapper>
);

export const renderBootloaderStep = ({ onAutoRepair }: { onAutoRepair: () => void }) => (
  <Wrapper>
    <Title>
      <Trans i18nKey="genuinecheck.deviceInBootloader">
        {"placeholder"}
        <b>{"placeholder"}</b>
        {"placeholder"}
      </Trans>
    </Title>
    <Button mt={2} primary onClick={onAutoRepair}>
      <Trans i18nKey="common.continue" />
    </Button>
  </Wrapper>
);
