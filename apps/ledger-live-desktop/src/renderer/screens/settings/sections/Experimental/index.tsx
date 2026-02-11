import React, { useEffect, useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { EnvName, isEnvDefault } from "@ledgerhq/live-env";
import { experimentalFeatures, isReadOnlyEnv, Feature } from "~/renderer/experimental";
import { useDispatch } from "LLD/hooks/redux";
import { setEnvOnAllThreads } from "~/helpers/env";
import { openModal } from "~/renderer/actions/modals";
import TrackPage from "~/renderer/analytics/TrackPage";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import Alert from "~/renderer/components/Alert";
import Button from "~/renderer/components/Button";
import { setShowClearCacheBanner } from "~/renderer/actions/settings";
import { SettingsSectionBody as Body, SettingsSectionRow as Row } from "../../SettingsSection";
import ExperimentalSwitch from "./ExperimentalSwitch";
import ExperimentalInteger from "./ExperimentalInteger";
import ExperimentalFloat from "./ExperimentalFloat";
import LottieTester from "../Developer/tools/LottieTester";
import PostOnboardingHubTester from "../Developer/tools/PostOnboardingHubTester";
import VaultSigner from "./VaultSigner";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-desktop";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

const experimentalTypesMap = {
  toggle: ExperimentalSwitch,
  integer: ExperimentalInteger,
  float: ExperimentalFloat,
};

const BaseExperimentalFeatureRow = ({
  feature,
  onChange,
}: {
  feature: Feature;
  onChange: (name: EnvName, value: unknown) => void;
}) => {
  const { dirty, ...rest } = feature;
  const Children = experimentalTypesMap[feature.type];
  const envValue = useEnv(feature.name);
  const isDefault = isEnvDefault(feature.name);

  return Children ? (
    <Row title={feature.title} desc={feature.description}>
      <Children
        readOnly={isReadOnlyEnv(feature.name)}
        isDefault={isDefault}
        onChange={onChange}
        {...rest}
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        value={envValue as number}
      />
    </Row>
  ) : null;
};

const ExperimentalFeatureRow = ({
  feature,
  onDirtyChange,
}: {
  feature: Feature;
  onDirtyChange: () => void;
}) => {
  const { dirty } = feature;
  const onChange = useCallback(
    (name: EnvName, value: unknown) => {
      if (dirty) {
        onDirtyChange();
      }
      setEnvOnAllThreads(name, value);
    },
    [dirty, onDirtyChange],
  );

  return <BaseExperimentalFeatureRow feature={feature} onChange={onChange} />;
};

const ForceProviderFeatureRow = ({
  feature,
  onDirtyChange,
}: {
  feature: Feature;
  onDirtyChange: () => void;
}) => {
  const { dirty } = feature;
  const dmk = useDeviceManagementKit();
  const ldmkFeatureFlag = useFeature("ldmkTransport");

  const onChange = useCallback(
    (name: EnvName, value: unknown) => {
      if (dirty) {
        onDirtyChange();
      }
      if (dmk && ldmkFeatureFlag?.enabled && typeof value === "number") {
        dmk.setProvider(value);
      }
      setEnvOnAllThreads(name, value);
    },
    [dirty, onDirtyChange, dmk, ldmkFeatureFlag],
  );

  return <BaseExperimentalFeatureRow feature={feature} onChange={onChange} />;
};

const EthereumBridgeRow = () => {
  const dispatch = useDispatch();
  return (
    <Row title="Open Ethereum WebSocket Bridge" desc="open a websocket bridge for web escape hatch">
      <Button
        onClick={() => {
          dispatch(
            openModal("MODAL_WEBSOCKET_BRIDGE", {
              appName: "Ethereum",
            }),
          );
        }}
      >
        Open
      </Button>
    </Row>
  );
};

const PluckProviderFeatureRow = (feature: Feature, onDirtyChange: () => void) => {
  switch (feature.name) {
    case "FORCE_PROVIDER":
      return (
        <ForceProviderFeatureRow
          key={feature.name}
          feature={feature}
          onDirtyChange={onDirtyChange}
        />
      );
    default:
      return (
        <ExperimentalFeatureRow
          key={feature.name}
          feature={feature}
          onDirtyChange={onDirtyChange}
        />
      );
  }
};

const SectionExperimental = () => {
  const [needsCleanCache, setNeedsCleanCache] = useState(false);
  const dispatch = useDispatch();
  const onDirtyChange = useCallback(() => setNeedsCleanCache(true), []);

  useEffect(() => {
    return () => {
      if (needsCleanCache) {
        dispatch(setShowClearCacheBanner(true));
      }
    };
  }, [dispatch, needsCleanCache]);

  return (
    <div data-e2e="experimental_section_title">
      <TrackPage category="Settings" name="Experimental" />
      <Body>
        <Alert type="security" m={4}>
          <Trans i18nKey="settings.experimental.disclaimer"></Trans>
        </Alert>
        {experimentalFeatures.map(feature =>
          !feature.shadow || (feature.shadow && !isEnvDefault(feature.name))
            ? PluckProviderFeatureRow(feature, onDirtyChange)
            : null,
        )}
        {process.env.SHOW_ETHEREUM_BRIDGE ? <EthereumBridgeRow /> : null}
        {process.env.DEBUG_LOTTIE ? <LottieTester /> : null}
        {process.env.DEBUG_POSTONBOARDINGHUB ? <PostOnboardingHubTester /> : null}
        <VaultSigner />
      </Body>
    </div>
  );
};

export default SectionExperimental;
