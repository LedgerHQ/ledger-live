import React, { useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogBody } from "@ledgerhq/lumen-ui-react";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import {
  dismiss as dismissRequest,
  registerCloseHandler,
} from "@ledgerhq/live-common/wallet-api/LiveAppModal/registry";
import { buildLiveAppModalURL } from "@ledgerhq/live-common/wallet-api/LiveAppModal/url";
import { handlers as liveAppModalHandlers } from "@ledgerhq/live-common/wallet-api/LiveAppModal/server";
import { handlers as deeplinkHandlers } from "@ledgerhq/live-common/wallet-api/CustomDeeplink/server";
import type { LiveAppModalSize } from "@ledgerhq/live-common/wallet-api/LiveAppModal/types";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import {
  stakeProgramsToEarnParam,
  getEthDepositScreenSetting,
} from "@ledgerhq/live-common/featureFlags/stakePrograms/index";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { openURL } from "~/renderer/linking";
import { useSelector } from "LLD/hooks/redux";
import { Web3AppWebview } from "~/renderer/components/Web3AppWebview";
import { NetworkErrorScreen } from "~/renderer/components/Web3AppWebview/NetworkError";
import useTheme from "~/renderer/hooks/useTheme";
import {
  counterValueCurrencySelector,
  languageSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { useVersionedStakePrograms } from "LLD/hooks/useVersionedStakePrograms";
import type { LiveAppModalParams } from "~/renderer/reducers/liveAppModal";
import type { LiveAppModalViewProps } from "./useLiveAppModalViewModel";

type ExtraInputs = Record<string, string | undefined> | null;

const DIALOG_SIZE_CLASSES: Record<LiveAppModalSize, string> = {
  medium: "w-[500px] max-w-[calc(100%-2rem)] h-[60vh] max-h-[60vh]",
  full: "w-[720px] max-w-[calc(100%-2rem)] h-[75vh] max-h-[75vh]",
};

const LiveAppModalContent = ({
  params,
  onClose,
  extraInputs,
}: {
  params: LiveAppModalParams;
  onClose: () => void;
  extraInputs: ExtraInputs;
}) => {
  const { requestId, manifestId, path, title, description } = params;
  const localManifest = useLocalLiveAppManifest(manifestId);
  const remoteManifest = useRemoteLiveAppManifest(manifestId);
  const manifest = localManifest || remoteManifest;
  const { updateManifests } = useRemoteLiveAppContext();

  const themeType = useTheme().theme;
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const countryLocale = getParsedSystemDeviceLocale().region;
  const discreetMode = useDiscreetMode();

  useEffect(() => {
    registerCloseHandler(requestId, onClose);
  }, [requestId, onClose]);

  useEffect(() => {
    // Safety net: if the component unmounts for any reason other than
    // onClose (e.g. Redux state cleared externally), make sure the
    // registry entry is resolved so the live-app's RPC promise settles.
    return () => {
      dismissRequest(requestId);
    };
  }, [requestId]);

  // The Earn middleware reads initialization state from the URL (theme, lang,
  // uiVersion, etc.) because getInitialURL passes goToURL through as-is
  // without merging our `inputs` prop.
  const goToURL = useMemo(() => {
    if (!manifest) return undefined;
    return buildLiveAppModalURL({
      manifestURL: manifest.url.toString(),
      path,
      requestId,
      inputs: {
        theme: themeType,
        lang: language,
        locale,
        countryLocale,
        currencyTicker: fiatCurrency.ticker,
        discreetMode: discreetMode ? "true" : "false",
        OS: "web",
        ...extraInputs,
      },
    });
  }, [
    manifest,
    path,
    requestId,
    themeType,
    language,
    locale,
    countryLocale,
    fiatCurrency.ticker,
    discreetMode,
    extraInputs,
  ]);

  const customHandlers = useMemo<WalletAPICustomHandlers>(
    () => ({
      ...liveAppModalHandlers({
        uiHooks: {
          // nested opens are rejected by the registry depth guard
          "custom.liveApp.modal.open": () => {
            /* no-op: nested modals not supported */
          },
        },
      }),
      ...deeplinkHandlers({
        uiHooks: {
          "custom.deeplink.open": openParams => {
            if (openParams) openURL(openParams.url);
          },
        },
      }),
    }),
    [],
  );

  return (
    <>
      <DialogHeader
        density={description ? "expanded" : "compact"}
        title={title}
        description={description}
        onClose={onClose}
      />
      <DialogBody className="flex min-h-0 grow flex-col p-0">
        {!manifest ? (
          <NetworkErrorScreen refresh={updateManifests} type="warning" />
        ) : (
          <Web3AppWebview
            manifest={manifest}
            customHandlers={customHandlers}
            hideLoader
            inputs={{
              theme: themeType,
              lang: language,
              locale,
              countryLocale,
              currencyTicker: fiatCurrency.ticker,
              discreetMode: discreetMode ? "true" : "false",
              OS: "web",
              isLiveAppModal: "true",
              liveAppModalRequestId: requestId,
              ...extraInputs,
              goToURL,
            }}
          />
        )}
      </DialogBody>
    </>
  );
};

const EarnLiveAppModalContent = ({
  params,
  onClose,
}: {
  params: LiveAppModalParams;
  onClose: () => void;
}) => {
  const { isEnabled: isLwd40Enabled } = useWalletFeaturesConfig("desktop");
  const earnUiFlag = useFeature("ptxEarnUi");
  const earnUiVersion = earnUiFlag?.params?.value ?? "v1";
  const stakePrograms = useVersionedStakePrograms();
  const extraInputs = useMemo<ExtraInputs>(() => {
    const { stakeProgramsParam, stakeCurrenciesParam } = stakeProgramsToEarnParam(stakePrograms);
    const ethDepositCohort = getEthDepositScreenSetting(stakePrograms);
    return {
      uiVersion: isLwd40Enabled ? earnUiVersion : "v1",
      lw40enabled: isLwd40Enabled ? "true" : "false",
      ethDepositCohort,
      stakeProgramsParam: stakeProgramsParam ? JSON.stringify(stakeProgramsParam) : undefined,
      stakeCurrenciesParam: stakeCurrenciesParam ? JSON.stringify(stakeCurrenciesParam) : undefined,
    };
  }, [stakePrograms, isLwd40Enabled, earnUiVersion]);

  return <LiveAppModalContent params={params} onClose={onClose} extraInputs={extraInputs} />;
};

const LiveAppModalView = ({ isOpen, params, onOpenChange, onClose }: LiveAppModalViewProps) => {
  if (!isOpen || !params) return null;
  const size = params.size ?? "full";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={DIALOG_SIZE_CLASSES[size]}>
        {params.useCase === "earn" ? (
          <EarnLiveAppModalContent params={params} onClose={onClose} />
        ) : (
          <LiveAppModalContent params={params} onClose={onClose} extraInputs={null} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LiveAppModalView;
