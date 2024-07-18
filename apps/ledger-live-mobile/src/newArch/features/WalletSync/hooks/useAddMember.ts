import { memberCredentialsSelector, setTrustchain } from "@ledgerhq/trustchain/store";
import { useDispatch, useSelector } from "react-redux";
import { useTrustchainSdk, runWithDevice } from "./useTrustchainSdk";
import { MemberCredentials, TrustchainResult } from "@ledgerhq/trustchain/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

export function useAddMember({ device }: { device: Device | null }) {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const [error, setError] = useState<Error | null>(null);

  const [userDeviceInteraction, setUserDeviceInteraction] = useState(false);

  const deviceRef = useRef(device);
  const memberCredentialsRef = useRef(memberCredentials);

  const transitionToNextScreen = useCallback(
    (trustchainResult: TrustchainResult) => {
      dispatch(setTrustchain(trustchainResult.trustchain));
      console.log("trustchainResult", trustchainResult);
    },
    [dispatch],
  );

  const handleMissingDevice = useCallback(() => {
    console.log("handleMissingDevice");
  }, []);

  const onRetry = () => {};

  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  useEffect(() => {
    if (!deviceRef.current) {
      handleMissingDevice();
    }

    const addMember = async () => {
      try {
        if (!deviceRef.current) return;
        await runWithDevice(deviceRef.current.deviceId, async transport => {
          const trustchainResult = await sdk.getOrCreateTrustchain(
            transport,
            memberCredentialsRef.current as MemberCredentials,
            {
              onStartRequestUserInteraction: () => {
                setUserDeviceInteraction(true);
              },
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
  }, [dispatch, handleMissingDevice, sdk, transitionToNextScreen]);

  return { error, userDeviceInteraction, handleMissingDevice, onRetry };
}
