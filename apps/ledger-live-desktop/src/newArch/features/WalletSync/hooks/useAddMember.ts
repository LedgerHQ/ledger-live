import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/trustchain/store";
import { useDispatch, useSelector } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { TrustchainResult, TrustchainResultType } from "@ledgerhq/trustchain/types";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  TrustchainAlreadyInitialized,
  TrustchainAlreadyInitializedWithOtherSeed,
} from "@ledgerhq/trustchain/errors";

export function useAddMember({ device }: { device: Device | null }) {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const trustchain = useSelector(trustchainSelector);
  const [error, setError] = useState<Error | null>(null);

  const [userDeviceInteraction, setUserDeviceInteraction] = useState(false);

  const sdkRef = useRef(sdk);
  const deviceRef = useRef(device);
  const trustchainRef = useRef(trustchain);
  const memberCredentialsRef = useRef(memberCredentials);

  const transitionToNextScreen = useCallback(
    (trustchainResult: TrustchainResult) => {
      dispatch(setTrustchain(trustchainResult.trustchain));
      dispatch(
        setFlow({
          flow: Flow.Activation,
          step: Step.ActivationLoading,
          nextStep:
            trustchainResult.type === TrustchainResultType.created
              ? Step.ActivationFinal
              : Step.SynchronizationFinal,
          hasTrustchainBeenCreated: trustchainResult.type === TrustchainResultType.created,
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
    const addMember = async () => {
      try {
        if (!deviceRef.current) {
          return handleMissingDevice();
        }
        if (!memberCredentialsRef.current) {
          throw new Error("memberCredentials is not set");
        }
        const trustchainResult = await sdkRef.current.getOrCreateTrustchain(
          deviceRef.current.deviceId,
          memberCredentialsRef.current,
          {
            onStartRequestUserInteraction: () => setUserDeviceInteraction(true),
            onEndRequestUserInteraction: () => setUserDeviceInteraction(false),
          },
          undefined,
          trustchainRef.current ?? undefined,
        );

        transitionToNextScreen(trustchainResult);
      } catch (error) {
        if (error instanceof TrustchainAlreadyInitialized) {
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.AlreadySecuredSameSeed }));
        } else if (error instanceof TrustchainAlreadyInitializedWithOtherSeed) {
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.AlreadySecuredOtherSeed }));
        } else {
          setError(error as Error);
        }
      }
    };

    addMember();
  }, [dispatch, handleMissingDevice, transitionToNextScreen]);

  return { error, userDeviceInteraction, handleMissingDevice, onRetry };
}
