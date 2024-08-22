import { useCallback, useState } from "react";
import { MemberCredentials } from "@ledgerhq/trustchain/types";
import { createQRCodeCandidateInstance } from "@ledgerhq/trustchain/qrcode/index";
import { InvalidDigitsError } from "@ledgerhq/trustchain/errors";
import { setTrustchain } from "@ledgerhq/trustchain/store";
import { useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { Steps } from "../types/Activation";
import { NavigatorName, ScreenName } from "~/const";
import { useInstanceName } from "./useInstanceName";

export const useSyncWithQrCode = () => {
  const [nbDigits, setDigits] = useState<number | null>(null);
  const [input, setInput] = useState<string | null>(null);
  const instanceName = useInstanceName();

  const navigation = useNavigation();

  const [inputCallback, setInputCallback] = useState<((input: string) => void) | null>(null);
  const dispatch = useDispatch();

  const onRequestQRCodeInput = useCallback(
    (config: { digits: number }, callback: (input: string) => void) => {
      setDigits(config.digits);
      setInputCallback(() => callback);
    },
    [],
  );

  const onSyncFinished = useCallback(() => {
    setDigits(null);
    setInput(null);
    setInputCallback(null);
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncSuccess,
      params: {
        created: false,
      },
    });
  }, [navigation]);

  const handleStart = useCallback(
    async (
      url: string,
      memberCredentials: MemberCredentials,
      setCurrentStep: (step: Steps) => void,
    ) => {
      try {
        const trustchain = await createQRCodeCandidateInstance({
          memberCredentials,
          scannedUrl: url,
          memberName: instanceName,
          onRequestQRCodeInput,
        });
        dispatch(setTrustchain(trustchain));
        onSyncFinished();
        return true;
      } catch (e) {
        if (e instanceof InvalidDigitsError) {
          setCurrentStep(Steps.SyncError);
          return;
        } else {
          setCurrentStep(Steps.UnbackedError);
          return;
        }
        throw e;
      }
    },
    [instanceName, onRequestQRCodeInput, onSyncFinished, dispatch],
  );

  const handleSendDigits = useCallback(
    (inputCallback: (_: string) => void, input: string) => (inputCallback(input), true),
    [],
  );

  return { nbDigits, input, handleStart, handleSendDigits, setInput, inputCallback };
};
