import React, { useCallback, useEffect } from "react";
import { setMemberCredentials, setTrustchain } from "@ledgerhq/trustchain/store";
import { useDispatch } from "react-redux";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";
import { runWithDevice, useTrustchainSdk } from "../../useTrustchainSdk";

import { DeviceModelId } from "@ledgerhq/devices";
import FollowStepsOnDevice from "../DeviceActions/FollowStepsOnDevice";

type Props = {
  device: Device | null;
};

export default function ActivationOrSynchroWithTrustchain({ device }: Props) {
  const sdk = useTrustchainSdk();
  const dispatch = useDispatch();

  const stuffHandledByTrustchain = useCallback(async () => {
    let hasFinished = false;
    const memberCredentials = await sdk.initMemberCredentials();
    dispatch(setMemberCredentials(memberCredentials));

    const seedIdToken = await runWithDevice(device?.deviceId, transport =>
      sdk.authWithDevice(transport),
    );
    const { trustchain, hasCreatedTrustchain } = await runWithDevice(device?.deviceId, transport =>
      sdk.getOrCreateTrustchain(transport, seedIdToken, memberCredentials, {
        onStartRequestUserInteraction: () => {},
        onEndRequestUserInteraction: () => {
          hasFinished = true;
        },
      }),
    );

    if (hasFinished) {
      dispatch(setTrustchain(trustchain));

      dispatch(
        setFlow({
          flow: Flow.Activation,
          step: hasCreatedTrustchain ? Step.ActivationFinal : Step.SynchronizationFinal,
        }),
      );
    }
  }, [sdk, dispatch, device?.deviceId]);

  useEffect(() => {
    stuffHandledByTrustchain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!device) return null;

  return <FollowStepsOnDevice modelId={device.modelId as DeviceModelId} />;

  //hasError ? (
  //   <UnsecuredError />
  // ) : (
  //   <Loading title={t("walletSync.loading.title")} subtitle={t("walletSync.loading.activation")} />
  // );
}
