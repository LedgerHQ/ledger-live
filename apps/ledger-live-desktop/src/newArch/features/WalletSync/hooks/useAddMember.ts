import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { useDispatch, useSelector } from "react-redux";
import { setDrawerVisibility, setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { TrustchainResult, TrustchainResultType } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  TrustchainAlreadyInitialized,
  TrustchainAlreadyInitializedWithOtherSeed,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import { track } from "~/renderer/analytics/segment";
import { AnalyticsPage } from "./useLedgerSyncAnalytics";
import { saveSettings, setLastOnboardedDevice } from "~/renderer/actions/settings";
import { useHistory } from "react-router";

export function useAddMember({
  device,
  sourcePage,
}: {
  device: Device | null;
  sourcePage?: AnalyticsPage;
}) {
  const dispatch = useDispatch();
  const history = useHistory();
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
      track("ledgersync_activated");
      if (sourcePage === AnalyticsPage.Onboarding) {
        dispatch(saveSettings({ hasCompletedOnboarding: true }));
        dispatch(setLastOnboardedDevice(device));
        history.push("/");
        dispatch(setDrawerVisibility(false));
      } else {
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
      }
    },
    [device, dispatch, history, sourcePage],
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
