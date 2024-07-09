import {
  memberCredentialsSelector,
  setMemberCredentials,
  setTrustchain,
} from "@ledgerhq/trustchain/store";
import { useDispatch, useSelector } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useTrustchainSdk, runWithDevice } from "./useTrustchainSdk";
import { TrustchainResult, TrustchainResultType } from "@ledgerhq/trustchain/types";
import { useEffect, useState } from "react";

export function useAddMember({ device }: { device: Device | null }) {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const [error, setError] = useState<Error | null>(null);

  const [userDeviceInteraction, setUserDeviceInteraction] = useState(false);

  useEffect(() => {
    if (!device) {
      handleMissingDevice();
    }

    addMember();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMember = async () => {
    let currentCredentials = memberCredentials;
    if (!currentCredentials) {
      const newMemberCredentials = await sdk.initMemberCredentials();
      dispatch(setMemberCredentials(newMemberCredentials));
      currentCredentials = newMemberCredentials;
    }

    try {
      runWithDevice(device?.deviceId, async transport => {
        const trustchainResult = await sdk.getOrCreateTrustchain(transport, currentCredentials, {
          onStartRequestUserInteraction: () => setUserDeviceInteraction(true),
          onEndRequestUserInteraction: () => setUserDeviceInteraction(false),
        });

        transitionToNextScreen(trustchainResult);
      });
    } catch (error) {
      setError(error as Error);
    }
  };

  const transitionToNextScreen = (trustchainResult: TrustchainResult) => {
    dispatch(setTrustchain(trustchainResult.trustchain));
    dispatch(
      setFlow({
        flow: Flow.Activation,
        step:
          trustchainResult.type === TrustchainResultType.created
            ? Step.ActivationFinal
            : Step.SynchronizationFinal,
      }),
    );
  };

  const handleMissingDevice = () => {
    dispatch(
      setFlow({
        flow: Flow.Activation,
        step: Step.DeviceAction,
      }),
    );
  };
  const onRetry = () => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
  };
  return { error, userDeviceInteraction, handleMissingDevice, onRetry };
}
