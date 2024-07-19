import { memberCredentialsSelector, setTrustchain } from "@ledgerhq/trustchain/store";
import { useDispatch, useSelector } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useTrustchainSdk, runWithDevice } from "./useTrustchainSdk";
import {
  MemberCredentials,
  TrustchainResult,
  TrustchainResultType,
} from "@ledgerhq/trustchain/types";
import { useCallback, useEffect, useRef, useState } from "react";

export function useAddMember({ device }: { device: Device | null }) {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const [error, setError] = useState<Error | null>(null);

  const [userDeviceInteraction, setUserDeviceInteraction] = useState(false);

  const sdkRef = useRef(sdk);
  const deviceRef = useRef(device);
  const memberCredentialsRef = useRef(memberCredentials);

  const transitionToNextScreen = useCallback(
    (trustchainResult: TrustchainResult) => {
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
    },
    [dispatch],
  );

  const handleMissingDevice = useCallback(() => {
    dispatch(
      setFlow({
        flow: Flow.Activation,
        step: Step.DeviceAction,
      }),
    );
  }, [dispatch]);

  const onRetry = () => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
  };

  useEffect(() => {
    if (!deviceRef.current) {
      handleMissingDevice();
    }

    const addMember = async () => {
      try {
        await runWithDevice(deviceRef.current?.deviceId, async transport => {
          const trustchainResult = await sdkRef.current.getOrCreateTrustchain(
            transport,
            memberCredentialsRef.current as MemberCredentials,
            {
              onStartRequestUserInteraction: () => setUserDeviceInteraction(true),
              onEndRequestUserInteraction: () => setUserDeviceInteraction(false),
            },
          );

          transitionToNextScreen(trustchainResult);
        });
      } catch (error) {
        setError(error as Error);
      }
    };

    addMember();
  }, [dispatch, handleMissingDevice, transitionToNextScreen]);

  return { error, userDeviceInteraction, handleMissingDevice, onRetry };
}
