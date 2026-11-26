import {
  classifyKeyRingError,
  commitKeyRingTree,
  selectKeyRingSession,
  type KeyRingActivation,
} from "@features/platform-key-ring";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useKeyRingClient } from "./useKeyRingClient";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnalyticsPage } from "./useLedgerSyncAnalytics";
import { useOnTrustchainJoined } from "./useOnTrustchainJoined";

export function useAddMember({
  device,
  sourcePage,
}: {
  device: Device | null;
  sourcePage?: AnalyticsPage;
}) {
  const dispatch = useDispatch();
  const sdk = useKeyRingClient();
  const session = useSelector(selectKeyRingSession);
  const [error, setError] = useState<Error | null>(null);

  const [userDeviceInteraction, setUserDeviceInteraction] = useState(false);

  const sdkRef = useRef(sdk);
  const deviceRef = useRef(device);
  const sessionRef = useRef(session);

  const onTrustchainJoined = useOnTrustchainJoined(sourcePage);

  const transitionToNextScreen = useCallback(
    (activation: KeyRingActivation) => {
      dispatch(commitKeyRingTree(activation.tree));
      onTrustchainJoined(activation, device);
    },
    [device, dispatch, onTrustchainJoined],
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
        const activation = await sdkRef.current.activate(sessionRef.current, {
          legacyDeviceId: deviceRef.current.deviceId,
          callbacks: {
            onStartRequestUserInteraction: () => setUserDeviceInteraction(true),
            onEndRequestUserInteraction: () => setUserDeviceInteraction(false),
          },
        });

        transitionToNextScreen(activation);
      } catch (error) {
        const category = classifyKeyRingError(error);
        if (category === "already-member") {
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.AlreadySecuredSameSeed }));
        } else if (category === "member-of-other-tree") {
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
