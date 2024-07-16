import { memberCredentialsSelector, setTrustchain } from "@ledgerhq/trustchain/store";
import { useDispatch, useSelector } from "react-redux";
import { useTrustchainSdk, runWithDevice } from "./useTrustchainSdk";
import {
  MemberCredentials,
  TrustchainResult,
  TrustchainResultType,
} from "@ledgerhq/trustchain/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { trace, listen } from "@ledgerhq/logs";

listen(log => {
  console.log(log);
});

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
      console.log("trustchainResult", trustchainResult);
    },
    [dispatch],
  );

  const handleMissingDevice = useCallback(() => {
    console.log("handleMissingDevice");
  }, []);

  const onRetry = () => {};

  useEffect(() => {
    if (!deviceRef.current) {
      handleMissingDevice();
    }

    const addMember = async () => {
      try {
        console.log("Running with device", deviceRef.current);

        if (!deviceRef.current) return;
        await runWithDevice(deviceRef.current.deviceId, async transport => {
          console.log("Getting or creating trustchain", transport);

          console.log("check transpoort", transport);
          const trustchainResult = await sdkRef.current.getOrCreateTrustchain(
            transport,
            memberCredentialsRef.current as MemberCredentials,
            {
              onStartRequestUserInteraction: () => {
                console.log("onStartRequestUserInteraction");
                setUserDeviceInteraction(true);
              },
              onEndRequestUserInteraction: () => setUserDeviceInteraction(false),
            },
          );

          transitionToNextScreen(trustchainResult);
        });
      } catch (error) {
        console.log("Error adding member", error);
        setError(error as Error);
      }
    };

    console.log("Adding member");

    addMember();
  }, [dispatch, handleMissingDevice, transitionToNextScreen]);

  return { error, userDeviceInteraction, handleMissingDevice, onRetry };
}
