import { useLedgerSyncActivation } from "@features/platform-ledger-sync";
import { selectKeyRingSession, type KeyRingActivation } from "@features/platform-key-ring";
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
  const activate = useLedgerSyncActivation();
  const [error, setError] = useState<Error | null>(null);

  const [userDeviceInteraction, setUserDeviceInteraction] = useState(false);

  const sdkRef = useRef(sdk);
  const deviceRef = useRef(device);
  const sessionRef = useRef(session);

  const onTrustchainJoined = useOnTrustchainJoined(sourcePage);

  const onActivated = useCallback(
    (activation: KeyRingActivation) => onTrustchainJoined(activation, device),
    [device, onTrustchainJoined],
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
    async function addMember() {
      if (!deviceRef.current) {
        return handleMissingDevice();
      }
      const outcome = await activate({
        client: sdkRef.current,
        session: sessionRef.current,
        legacyDeviceId: deviceRef.current.deviceId,
        callbacks: {
          onStartRequestUserInteraction: () => setUserDeviceInteraction(true),
          onEndRequestUserInteraction: () => setUserDeviceInteraction(false),
        },
        onActivated,
      });
      if (outcome.type === "done") return;

      if (outcome.reason === "already-member") {
        dispatch(setFlow({ flow: Flow.Synchronize, step: Step.AlreadySecuredSameSeed }));
      } else if (outcome.reason === "member-of-other-tree") {
        dispatch(setFlow({ flow: Flow.Synchronize, step: Step.AlreadySecuredOtherSeed }));
      } else {
        setError(outcome.error as Error);
      }
    }

    addMember();
  }, [activate, dispatch, handleMissingDevice, onActivated]);

  return { error, userDeviceInteraction, handleMissingDevice, onRetry };
}
