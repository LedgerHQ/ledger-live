import React, { useCallback, useEffect } from "react";
import Loading from "../../components/LoadingStep";
import { useTranslation } from "react-i18next";
import { UnsecuredError } from "./03-UnsecuredError";
import { setLiveCredentials, setTrustchain } from "@ledgerhq/trustchain/store";
import { useDispatch } from "react-redux";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";
import { runWithDevice, useTrustchainSdk } from "../../useTrustchainSdk";

type Props = {
  device: Device | null;
};

export default function ActivationOrSynchroWithTrustchain({ device }: Props) {
  const { t } = useTranslation();
  const sdk = useTrustchainSdk();
  const dispatch = useDispatch();

  const hasError = false;

  const stuffHandledByTrustchain = useCallback(async () => {
    const liveCredentials = await sdk.initLiveCredentials();
    dispatch(setLiveCredentials(liveCredentials));

    const seedIdToken = await runWithDevice(device?.deviceId, transport =>
      sdk.seedIdAuthenticate(transport),
    );

    const { trustchain, hasCreatedTrustchain } = await runWithDevice(
      device?.deviceId,
      transport => {
        return sdk.getOrCreateTrustchain(transport, seedIdToken, liveCredentials);
      },
    );
    dispatch(setTrustchain(trustchain));

    dispatch(
      setFlow({
        flow: Flow.Activation,
        step: hasCreatedTrustchain ? Step.ActivationFinal : Step.SynchronizationFinal,
      }),
    );
  }, [sdk, dispatch, device?.deviceId]);

  useEffect(() => {
    !hasError && stuffHandledByTrustchain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return hasError ? (
    <UnsecuredError />
  ) : (
    <Loading title={t("walletSync.loading.title")} subtitle={t("walletSync.loading.activation")} />
  );
}
