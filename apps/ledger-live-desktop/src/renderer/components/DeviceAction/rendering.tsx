import React, { useCallback, useContext, useEffect } from "react";
import { BigNumber } from "bignumber.js";
import map from "lodash/map";
import { TFunction, Trans } from "react-i18next";
import { connect, useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { ExchangeRate, Exchange } from "@ledgerhq/live-common/exchange/swap/types";

import { getProviderName, getNoticeType } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { WrongDeviceForAccount, UpdateYourApp, LockedDeviceError } from "@ledgerhq/errors";

import { LatestFirmwareVersionRequired, DeviceNotOnboarded } from "@ledgerhq/live-common/errors";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  getAccountUnit,
  getMainAccount,
  getAccountName,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import { closeAllModal } from "~/renderer/actions/modals";
import Animation from "~/renderer/animations";
import Button from "~/renderer/components/Button";
import TranslatedError from "~/renderer/components/TranslatedError";
import Box from "~/renderer/components/Box";
import BigSpinner from "~/renderer/components/BigSpinner";
import Alert from "~/renderer/components/Alert";
import ConnectTroubleshooting from "~/renderer/components/ConnectTroubleshooting";
import ExportLogsButton from "~/renderer/components/ExportLogsButton";
import { getDeviceAnimation } from "./animations";
import { DeviceBlocker } from "./DeviceBlocker";
import ErrorIcon from "~/renderer/components/ErrorIcon";
import IconTriangleWarning from "~/renderer/icons/TriangleWarning";
import { urls } from "~/config/urls";
import CurrencyUnitValue from "~/renderer/components/CurrencyUnitValue";
import ExternalLinkButton from "../ExternalLinkButton";
import TrackPage, { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { Rotating } from "~/renderer/components/Spinner";
import ProgressCircle from "~/renderer/components/ProgressCircle";
import CrossCircle from "~/renderer/icons/CrossCircle";
import { getProviderIcon } from "~/renderer/screens/exchange/Swap2/utils";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { context } from "~/renderer/drawers/Provider";
import { track } from "~/renderer/analytics/segment";
import { DrawerFooter } from "~/renderer/screens/exchange/Swap2/Form/DrawerFooter";
import {
  Theme,
  Button as ButtonV3,
  Flex,
  Text,
  Log,
  ProgressLoader,
  BoxedIcon,
} from "@ledgerhq/react-ui";
import { LockAltMedium } from "@ledgerhq/react-ui/assets/icons";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import DeviceIllustration from "~/renderer/components/DeviceIllustration";
import FramedImage from "../CustomImage/FramedImage";

export const AnimationWrapper = styled.div`
  width: 600px;
  max-width: 100%;
  padding-bottom: 20px;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
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
`;

export const ConfirmWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
  min-height: 260px;
  max-width: 100%;
`;

const Logo = styled.div<{ warning?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${p =>
    p.info
      ? p.theme.colors.palette.primary.main
      : p.warning
      ? p.theme.colors.warning
      : p.theme.colors.alertRed};
  margin-bottom: 20px;
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
  variant: "paragraph",
  fontWeight: "semiBold",
  color: "palette.text.shade100",
  textAlign: "center",
  fontSize: 5,
})`
  white-space: pre-line;
`;

export const SubTitle = styled(Text).attrs({
  variant: "paragraph",
  color: "palette.text.shade100",
  textAlign: "center",
  fontSize: 3,
})`
  margin-top: 8px;
`;

const ErrorTitle = styled(Text).attrs({
  variant: "paragraph",
  fontWeight: "semiBold",
  color: "palette.text.shade100",
  textAlign: "center",
  fontSize: 6,
})`
  user-select: text;
  margin-bottom: 10px;
`;

const ErrorDescription = styled(Text).attrs({
  variant: "paragraph",
  color: "palette.text.shade60",
  textAlign: "center",
  fontSize: 4,
})`
  user-select: text;
`;

const ButtonContainer = styled(Box).attrs(() => ({
  mt: 25,
  horizontal: true,
}))``;

const TroubleshootingWrapper = styled.div`
  margin-top: auto;
  margin-bottom: 16px;
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
    <AnimationWrapper modelId={modelId}>
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
  <AnimationWrapper modelId={modelId}>
    <DeviceBlocker />
    <Animation animation={getDeviceAnimation(modelId, type, "verify")} />
  </AnimationWrapper>
);

const OpenManagerBtn = ({
  closeAllModal,
  appName,
  updateApp,
  firmwareUpdate,
  mt = 2,
  ml = 0,
}: {
  closeAllModal: () => void;
  appName?: string;
  updateApp?: boolean;
  firmwareUpdate?: boolean;
  mt?: number;
  ml?: number;
}) => {
  const history = useHistory();
  const { setDrawer } = useContext(context);

  const onClick = useCallback(() => {
    const urlParams = new URLSearchParams({
      updateApp: updateApp ? "true" : "false",
      firmwareUpdate: firmwareUpdate ? "true" : "false",
      ...(appName ? { q: appName } : {}),
    });
    const search = urlParams.toString();
    setTrackingSource("device action open manager button");
    history.push({
      pathname: "/manager",
      search: search ? `?${search}` : "",
    });
    closeAllModal();
    setDrawer(undefined);
  }, [updateApp, firmwareUpdate, appName, history, closeAllModal, setDrawer]);

  return (
    <Button mt={mt} ml={ml} primary onClick={onClick}>
      <Trans i18nKey="DeviceAction.openManager" />
    </Button>
  );
};

const OpenOnboardingBtn = () => {
  const { setDrawer } = useContext(context);
  const dispatch = useDispatch();
  const history = useHistory();

  const onClick = useCallback(() => {
    setTrackingSource("device action open onboarding button");
    dispatch(closeAllModal());
    setDrawer(undefined);
    history.push("/onboarding");
  }, [dispatch, history, setDrawer]);

  return (
    <Button primary onClick={onClick}>
      <Trans i18nKey="DeviceAction.openOnboarding" />
    </Button>
  );
};

const OpenManagerButton = connect(null, { closeAllModal })(OpenManagerBtn);

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
  request: unknown;
  analyticsPropertyFlow?: string;
}) => {
  const currency = request?.currency || request?.account?.currency;
  const appNameToTrack = appName || request?.appName || currency?.managerAppName;
  const cleanProgress = progress ? Math.round(progress * 100) : null;
  useEffect(() => {
    const trackingArgs = [
      "In-line app install",
      { appName: appNameToTrack, flow: analyticsPropertyFlow },
    ];
    track(...trackingArgs);
  }, [appNameToTrack, analyticsPropertyFlow]);
  return (
    <Wrapper data-test-id="device-action-loader">
      <Header />
      <AnimationWrapper modelId={modelId}>
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
  const cleanProgress = Math.round(progress * 100);

  return (
    <Flex
      flex={1}
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      data-test-id="installing-language-progress"
    >
      <ProgressWrapper>
        <ProgressLoader progress={cleanProgress} />
      </ProgressWrapper>
      <Log extraTextProps={{ fontSize: 20 }} alignSelf="stretch" mx="115px" mt={30}>
        {t("deviceLocalization.installingLanguage")}
      </Log>
    </Flex>
  );
};

export const renderListingApps = () => (
  <Wrapper data-test-id="device-action-loader">
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
  wording,
}: {
  modelId: DeviceModelId;
  type: Theme["theme"];
  wording: string;
}) => (
  <Wrapper>
    <DeviceBlocker />
    <Header />
    <AnimationWrapper modelId={modelId}>
      <Animation animation={getDeviceAnimation(modelId, type, "allowManager")} />
    </AnimationWrapper>
    <Footer>
      <Title>
        <Trans i18nKey="DeviceAction.allowManagerPermission" values={{ wording }} />
      </Title>
    </Footer>
  </Wrapper>
);

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
    data-test-id="allow-language-installation"
  >
    <DeviceBlocker />
    <AnimationWrapper modelId={modelId}>
      <Animation animation={getDeviceAnimation(modelId, type, "verify")} />
    </AnimationWrapper>
    <Log extraTextProps={{ fontSize: 20 }} alignSelf="stretch" mx={16} mt={10}>
      {t(`deviceLocalization.allowLanguageInstallation`)}
    </Log>
  </Flex>
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
    <AnimationWrapper modelId={modelId}>
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
      <Button secondary onClick={passWarning}>
        <Trans i18nKey="common.continue" />
      </Button>
      <OpenManagerButton ml={4} mt={0} appName={appName} updateApp />
    </ButtonContainer>
  </Wrapper>
);

// Quick fix: the error LockedDeviceError should be catched
// inside all the device actions and mapped to an event of type "lockedDevice".
// With this fix, we can catch all the device action error that were not catched upstream.
// If LockedDeviceError is thrown from outside a device action and renderError was not called
// it is still handled by GenericErrorView.
export const renderLockedDeviceError = ({
  t,
  device,
  onRetry,
}: {
  t: TFunction;
  device?: Device;
  onRetry?: () => void;
}) => {
  const productName = device ? getDeviceModel(device.modelId).productName : null;

  return (
    <Wrapper id="error-locked-device">
      <Flex mb={5}>
        <BoxedIcon size={64} Icon={LockAltMedium} iconSize={24} iconColor="neutral.c100" />
      </Flex>
      <ErrorTitle>{t("errors.LockedDeviceError.title")}</ErrorTitle>
      <ErrorDescription>
        {productName
          ? t("errors.LockedDeviceError.descriptionWithProductName", {
              productName,
            })
          : t("errors.LockedDeviceError.description")}
      </ErrorDescription>
      <ButtonContainer>
        {onRetry ? (
          <Button primary onClick={onRetry}>
            {t("common.retry")}
          </Button>
        ) : null}
      </ButtonContainer>
    </Wrapper>
  );
};

export const RenderDeviceNotOnboardedError = ({ t, device }: { t: TFunction; device?: Device }) => {
  const productName = device ? getDeviceModel(device.modelId).productName : null;
  const history = useHistory();
  const { setDrawer } = useContext(context);
  const dispatch = useDispatch();

  const redirectToOnboarding = useCallback(() => {
    setTrackingSource("device action open onboarding button");
    dispatch(closeAllModal());
    setDrawer(undefined);
    history.push(device?.modelId === "stax" ? "/sync-onboarding/manual" : "/onboarding");
  }, [device?.modelId, dispatch, history, setDrawer]);

  return (
    <Wrapper id="error-device-not-onboarded">
      {device ? (
        <Flex mb={5}>
          <DeviceIllustration deviceId={device.modelId} />
        </Flex>
      ) : null}
      <Text color="neutral.c100" fontSize={7} mb={2}>
        {productName
          ? t("errors.DeviceNotOnboardedError.titleWithProductName", {
              productName,
            })
          : t("errors.DeviceNotOnboardedError.title")}
      </Text>
      <Text
        variant="paragraph"
        color="neutral.c80"
        fontSize={6}
        whiteSpace="pre-wrap"
        textAlign="center"
      >
        {productName
          ? t("errors.DeviceNotOnboardedError.descriptionWithProductName", {
              productName,
            })
          : t("errors.DeviceNotOnboardedError.description")}
      </Text>
      <ButtonV3 variant="main" borderRadius="9999px" mt={5} onClick={redirectToOnboarding}>
        {productName
          ? t("errors.DeviceNotOnboardedError.goToOnboardingButtonWithProductName", {
              productName,
            })
          : t("errors.DeviceNotOnboardedError.goToOnboardingButton")}
      </ButtonV3>
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
  warning,
  info,
  managerAppName,
  requireFirmwareUpdate,
  withOnboardingCTA,
  device,
}: {
  error: Error;
  t: TFunction;
  withOpenManager?: boolean;
  onRetry?: () => void;
  withExportLogs?: boolean;
  list?: boolean;
  supportLink?: string;
  warning?: boolean;
  info?: boolean;
  managerAppName?: string;
  requireFirmwareUpdate?: boolean;
  withOnboardingCTA?: boolean;
  device?: Device;
}) => {
  // Redirects from renderError and not from DeviceActionDefaultRendering because renderError
  // can be used directly by other component
  if (error instanceof LockedDeviceError) {
    return renderLockedDeviceError({ t, onRetry, device });
  } else if (error instanceof DeviceNotOnboarded) {
    return <RenderDeviceNotOnboardedError t={t} device={device} />;
  }

  return (
    <Wrapper id={`error-${error.name}`}>
      <Logo info={info} warning={warning}>
        <ErrorIcon size={44} error={error} />
      </Logo>
      <ErrorTitle>
        <TranslatedError error={error} noLink />
      </ErrorTitle>
      <ErrorDescription>
        <TranslatedError error={error} field="description" />
      </ErrorDescription>
      {list ? (
        <ErrorDescription>
          <ol style={{ textAlign: "justify" }}>
            <TranslatedError error={error} field="list" />
          </ol>
        </ErrorDescription>
      ) : null}
      <ButtonContainer>
        {managerAppName || requireFirmwareUpdate ? (
          <OpenManagerButton
            appName={managerAppName}
            updateApp={error instanceof UpdateYourApp}
            firmwareUpdate={error instanceof LatestFirmwareVersionRequired}
          />
        ) : (
          <>
            {supportLink ? (
              <ExternalLinkButton label={t("common.getSupport")} url={supportLink} />
            ) : null}
            {withExportLogs ? (
              <ExportLogsButton
                title={t("settings.exportLogs.title")}
                small={false}
                primary={false}
                outlineGrey
                mx={1}
              />
            ) : null}
            {withOpenManager ? (
              <OpenManagerButton mt={0} ml={withExportLogs ? 4 : 0} />
            ) : onRetry ? (
              <Button primary ml={withExportLogs ? 4 : 0} onClick={onRetry}>
                {t("common.retry")}
              </Button>
            ) : null}
            {withOnboardingCTA ? <OpenOnboardingBtn /> : null}
          </>
        )}
      </ButtonContainer>
    </Wrapper>
  );
};

export const renderInWrongAppForAccount = ({
  t,
  onRetry,
  accountName,
}: {
  t: TFunction;
  onRetry: () => void;
  accountName: string;
}) =>
  renderError({
    t,
    error: new WrongDeviceForAccount(null, { accountName }),
    withExportLogs: true,
    onRetry,
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
  onRepairModal: () => void;
  device: Device;
  unresponsive?: boolean;
}) => (
  <Wrapper>
    <Header />
    <AnimationWrapper modelId={modelId}>
      <Animation
        animation={getDeviceAnimation(
          modelId,
          type,
          unresponsive ? "enterPinCode" : "plugAndPinCode",
        )}
      />
    </AnimationWrapper>
    <Footer>
      <Title>
        <Trans
          i18nKey={
            unresponsive ? "DeviceAction.unlockDevice" : "DeviceAction.connectAndUnlockDevice"
          }
        />
      </Title>
      {!device ? (
        <TroubleshootingWrapper>
          <ConnectTroubleshooting onRepair={onRepairModal} />
        </TroubleshootingWrapper>
      ) : null}
    </Footer>
  </Wrapper>
);

export const renderFirmwareUpdating = ({
  modelId,
  type,
}: {
  modelId: DeviceModelId;
  type: Theme["theme"];
}) => (
  <Wrapper>
    <Header />
    <AnimationWrapper modelId={modelId}>
      <Animation animation={getDeviceAnimation(modelId, type, "firmwareUpdating")} />
    </AnimationWrapper>
    <Footer>
      <Title>
        <Trans i18nKey={"DeviceAction.unlockDeviceAfterFirmwareUpdate"} />
      </Title>
    </Footer>
  </Wrapper>
);

export const renderSwapDeviceConfirmation = ({
  modelId,
  type,
  transaction,
  exchangeRate,
  exchange,
  amountExpectedTo,
  estimatedFees,
  swapDefaultTrack,
}: {
  modelId: DeviceModelId;
  type: Theme["theme"];
  transaction: Transaction;
  exchangeRate: ExchangeRate;
  exchange: Exchange;
  amountExpectedTo?: string;
  estimatedFees?: string;
  swapDefaultTrack: Record<string, string>;
}) => {
  const ProviderIcon = getProviderIcon(exchangeRate);
  const [sourceAccountName, sourceAccountCurrency] = [
    getAccountName(exchange.fromAccount),
    getAccountCurrency(exchange.fromAccount),
  ];
  const [targetAccountName, targetAccountCurrency] = [
    getAccountName(exchange.toAccount),
    getAccountCurrency(exchange.toAccount),
  ];
  const providerName = getProviderName(exchangeRate.provider);
  const noticeType = getNoticeType(exchangeRate.provider);
  const alertProperties = noticeType.learnMore ? { learnMoreUrl: urls.swap.learnMore } : {};
  return (
    <>
      <ConfirmWrapper>
        <TrackPage
          category="Swap"
          name={`ModalStep-summary`}
          sourcecurrency={sourceAccountCurrency?.name}
          targetcurrency={targetAccountCurrency?.name}
          provider={exchangeRate.provider}
          {...swapDefaultTrack}
        />
        <Box flex={0}>
          <Alert type="primary" {...alertProperties} mb={7} mx={4}>
            <Trans
              i18nKey={`DeviceAction.swap.notice.${noticeType.message}`}
              values={{ providerName: getProviderName(exchangeRate.provider) }}
            />
          </Alert>
        </Box>
        <Box mx={6} data-test-id="device-swap-summary">
          {map(
            {
              amountSent: (
                <CurrencyUnitValue
                  unit={getAccountUnit(exchange.fromAccount)}
                  value={transaction.amount}
                  disableRounding
                  showCode
                />
              ),
              amountReceived: (
                <CurrencyUnitValue
                  unit={getAccountUnit(exchange.toAccount)}
                  value={amountExpectedTo ? BigNumber(amountExpectedTo) : exchangeRate.toAmount}
                  disableRounding
                  showCode
                />
              ),
              provider: (
                <Box horizontal alignItems="center" style={{ gap: "6px" }}>
                  <ProviderIcon size={18} />
                  <Text>{providerName}</Text>
                </Box>
              ),
              fees: (
                <CurrencyUnitValue
                  unit={getAccountUnit(
                    getMainAccount(exchange.fromAccount, exchange.fromParentAccount),
                  )}
                  value={BigNumber(estimatedFees || 0)}
                  disableRounding
                  showCode
                />
              ),
              sourceAccount: (
                <Box horizontal alignItems="center" style={{ gap: "6px" }}>
                  {sourceAccountCurrency && (
                    <CryptoCurrencyIcon circle currency={sourceAccountCurrency} size={18} />
                  )}
                  <Text style={{ textTransform: "capitalize" }}>{sourceAccountName}</Text>
                </Box>
              ),
              targetAccount: (
                <Box horizontal alignItems="center" style={{ gap: "6px" }}>
                  {targetAccountCurrency && (
                    <CryptoCurrencyIcon circle currency={targetAccountCurrency} size={18} />
                  )}
                  <Text style={{ textTransform: "capitalize" }}>{targetAccountName}</Text>
                </Box>
              ),
            },
            (value, key) => {
              return (
                <Box horizontal justifyContent="space-between" key={key} mb={4}>
                  <Text fontWeight="medium" color="palette.text.shade40" fontSize="14px">
                    <Trans i18nKey={`DeviceAction.swap2.${key}`} />
                  </Text>
                  <Text fontWeight="semiBold" color="palette.text.shade100" fontSize="14px">
                    {value}
                  </Text>
                </Box>
              );
            },
          )}
        </Box>
        {renderVerifyUnwrapped({ modelId, type })}
      </ConfirmWrapper>
      <DrawerFooter provider={exchangeRate.provider} />
    </>
  );
};

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
    <Alert type="primary" learnMoreUrl={urls.swap.learnMore} horizontal={false}>
      <Trans i18nKey={`DeviceAction.${exchangeType}.notice`} />
    </Alert>
    {renderVerifyUnwrapped({ modelId, type })}
    <Box alignItems={"center"}>
      <Text textAlign="center" fontWeight="semiBold" color="palette.text.shade100" fontSize={5}>
        <Trans i18nKey={`DeviceAction.${exchangeType}.confirm`} />
      </Text>
    </Box>
  </>
);

export const renderLoading = ({
  modelId,
  children,
}: {
  modelId: DeviceModelId;
  children?: React.ReactNode;
}) => (
  <Wrapper data-test-id="device-action-loader">
    <Header />
    <AnimationWrapper modelId={modelId}>
      <BigSpinner size={50} />
    </AnimationWrapper>
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

const ImageLoadingGenericWithoutStyleProvider: React.FC<{
  title: string;
  children?: React.ReactNode | undefined;
  top?: React.ReactNode | undefined;
  bottom?: React.ReactNode | undefined;
  testId?: string;
}> = ({ title, top, bottom, children, testId }) => {
  return (
    <Flex
      flexDirection="column"
      justifyContent="space-between"
      alignItems="center"
      flex={1}
      alignSelf="stretch"
      data-test-id={testId}
    >
      <Flex flex={1} flexDirection="column" alignItems={"center"}>
        {top}
      </Flex>
      <Flex flexDirection={"column"} alignItems="center" alignSelf="stretch">
        <Text
          textAlign="center"
          variant="h4Inter"
          fontWeight="semiBold"
          mb={12}
          alignSelf="stretch"
        >
          {title}
        </Text>
        {children}
      </Flex>
      <Flex flex={1} flexDirection="column" alignItems={"center"}>
        {bottom}
      </Flex>
    </Flex>
  );
};
const ImageLoadingGeneric = withV3StyleProvider(ImageLoadingGenericWithoutStyleProvider);

export const renderImageLoadRequested = ({
  t,
  device,
  type,
}: {
  t: TFunction;
  device: Device;
  type: Theme["theme"];
}) => {
  return (
    <ImageLoadingGeneric
      title={t("customImage.steps.transfer.allowPreview", {
        productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
      })}
      progress={0}
      testId="device-action-image-load-requested"
    >
      <FramedImage
        background={
          <Animation animation={getDeviceAnimation(device.modelId, type, "allowManager", true)} />
        }
      />
    </ImageLoadingGeneric>
  );
};

export const renderLoadingImage = ({
  t,
  device,
  progress,
  source,
}: {
  t: TFunction;
  progress?: number;
  device: Device;
  source?: string | undefined;
}) => {
  return (
    <ImageLoadingGeneric
      title={t("customImage.steps.transfer.loadingPicture", {
        productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
      })}
      testId={`device-action-image-loading-${progress}`}
    >
      <FramedImage source={source} loadingProgress={progress} />
    </ImageLoadingGeneric>
  );
};

export const renderImageCommitRequested = ({
  t,
  device,
  source,
  type,
}: {
  t: TFunction;
  device: Device;
  source?: string | undefined;
  type: Theme["theme"];
}) => {
  return (
    <ImageLoadingGeneric
      title={t("customImage.steps.transfer.confirmPicture", {
        productName: device.deviceName || getDeviceModel(device.modelId)?.productName,
      })}
      testId="device-action-image-commit-requested"
    >
      <FramedImage
        source={source}
        background={
          <Animation
            animation={getDeviceAnimation(device.modelId, type, "confirmLockscreen", true)}
          />
        }
      />
    </ImageLoadingGeneric>
  );
};
