import React, { useCallback, useEffect, useState } from "react";
import {
  memberCredentialsSelector,
  setMemberCredentials,
  setTrustchain,
} from "@ledgerhq/trustchain/store";
import { useDispatch, useSelector } from "react-redux";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { setFlow } from "~/renderer/actions/walletSync";
import { runWithDevice, useTrustchainSdk } from "../../useTrustchainSdk";

import { DeviceModelId } from "@ledgerhq/devices";
import FollowStepsOnDevice from "../DeviceActions/FollowStepsOnDevice";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";

type Props = {
  device: Device | null;
};

export default function ActivationOrSynchroWithTrustchain({ device }: Props) {
  const sdk = useTrustchainSdk();

  const memberCredentials = useSelector(memberCredentialsSelector);
  const dispatch = useDispatch();
  const [error, setError] = useState<Error | null>(null);

  const onRetry = () => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
  };

  const stuffHandledByTrustchain = useCallback(async () => {
    if (!memberCredentials) {
      const newMemberCredentials = await sdk.initMemberCredentials();
      dispatch(setMemberCredentials(newMemberCredentials));
    } else {
      try {
        const seedIdToken = await runWithDevice("", transport => sdk.authWithDevice(transport));
        const { trustchain, hasCreatedTrustchain } = await runWithDevice("", transport =>
          sdk.getOrCreateTrustchain(transport, seedIdToken, memberCredentials),
        );

        if (trustchain) {
          dispatch(setTrustchain(trustchain));

          dispatch(
            setFlow({
              flow: Flow.Activation,
              step: hasCreatedTrustchain ? Step.ActivationFinal : Step.SynchronizationFinal,
            }),
          );
        }
      } catch (error) {
        setError(error as Error);
      }
    }
  }, [memberCredentials, sdk, dispatch]);

  useEffect(() => {
    stuffHandledByTrustchain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (device) {
    return error ? (
      <ErrorDisplay error={error} withExportLogs onRetry={onRetry} />
    ) : (
      <FollowStepsOnDevice modelId={device.modelId as DeviceModelId} />
    );
  } else {
    dispatch(
      setFlow({
        flow: Flow.Activation,
        step: Step.DeviceAction,
      }),
    );
  }
}
