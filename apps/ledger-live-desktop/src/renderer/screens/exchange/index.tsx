import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { RampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/types";
import Box from "~/renderer/components/Box";
import Card from "~/renderer/components/Box/Card";
import TabBar from "~/renderer/components/TabBar";
import { languageSelector } from "~/renderer/reducers/settings";
import OnRamp from "./Buy";
import { useExchangeProvider } from "./hooks";
import OffRamp from "./Sell";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import useTheme from "~/renderer/hooks/useTheme";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import WebPTXPlayer from "~/renderer/components/WebPTXPlayer";
import { LiveAppManifest, Loadable } from "@ledgerhq/live-common/platform/types";

const Container = styled(Box)`
  flex: 1;
  display: flex;
`;
const tabs = [
  {
    header: "exchange.buy.header",
    title: "exchange.buy.tab",
    component: OnRamp,
  },
  {
    header: "exchange.sell.header",
    title: "exchange.sell.tab",
    component: OffRamp,
  },
];
export type DProps = {
  defaultCurrencyId?: string | null;
  defaultAccountId?: string | null;
  defaultTicker?: string | null;
  rampCatalog: Loadable<RampCatalog>;
};
type QueryParams = {
  mode?: "onRamp" | "offRamp";
  currencyId?: string;
  accountId?: string;
  defaultTicker?: string;
};
const DEFAULT_MULTIBUY_APP_ID = "multibuy";

// Exchange (Buy / Sell) as a live app screen
const LiveAppExchange = ({ appId }: { appId: string }) => {
  const { state: urlParams, search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const locale = useSelector(languageSelector);

  const mockManifest: LiveAppManifest | undefined =
    process.env.MOCK_REMOTE_LIVE_MANIFEST && JSON.parse(process.env.MOCK_REMOTE_LIVE_MANIFEST)[0];

  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const manifest = localManifest || mockManifest || remoteManifest;
  const themeType = useTheme("colors.palette.type");

  return (
    <Card
      grow
      style={{
        overflow: "hidden",
      }}
    >
      {manifest ? (
        <WebPTXPlayer
          manifest={manifest}
          inputs={{
            theme: themeType,
            ...(urlParams as object),
            lang: locale,
            ...Object.fromEntries(searchParams.entries()),
          }}
        />
      ) : null}
    </Card>
  );
};

// Legacy native Exchange (Buy / Sell) screen, should be deprecated soonish
const LegacyExchange = () => {
  const rampCatalog = useRampCatalog();
  const location = useLocation<QueryParams>();
  const [provider] = useExchangeProvider();
  // no clue what's up
  const state = location.state;
  const defaultMode = state?.mode || "onRamp";
  const [activeTabIndex, setActiveTabIndex] = useState(defaultMode === "onRamp" ? 0 : 1);
  const { t } = useTranslation();
  const Component = tabs[activeTabIndex].component;
  return (
    <Container pb={6} selectable>
      <Box ff="Inter|SemiBold" fontSize={7} color="palette.text.shade100" id="exchange-title">
        {t(tabs[activeTabIndex].header, {
          provider: ("id" in provider && provider.id) || undefined,
        })}
      </Box>
      <TabBar
        index={activeTabIndex}
        tabs={tabs.map(tab => t(tab.title))}
        onIndexChange={setActiveTabIndex}
      />
      <Card
        grow
        style={{
          overflow: "hidden",
        }}
      >
        {rampCatalog.value ? (
          <Component
            defaultCurrencyId={state?.currencyId}
            defaultAccountId={state?.accountId}
            defaultTicker={state?.defaultTicker}
            rampCatalog={rampCatalog}
          />
        ) : null}
      </Card>
    </Container>
  );
};
const Exchange = () => {
  // PTX smart routing feature flag - buy sell live app flag
  const ptxSmartRouting = useFeature("ptxSmartRouting");
  if (ptxSmartRouting?.enabled) {
    return (
      <LiveAppExchange appId={ptxSmartRouting?.params?.liveAppId ?? DEFAULT_MULTIBUY_APP_ID} />
    );
  }
  return <LegacyExchange />;
};
export default Exchange;
