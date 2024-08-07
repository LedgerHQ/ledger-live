import { useCallback, useState } from "react";
import { MemberCredentials } from "@ledgerhq/trustchain/types";
import { createQRCodeCandidateInstance } from "@ledgerhq/trustchain/qrcode/index";
import { InvalidDigitsError } from "@ledgerhq/trustchain/errors";
import { setTrustchain } from "@ledgerhq/trustchain/store";
import { useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { Platform } from "react-native";

export const useSyncWithQrCode = () => {
  const [digits, setDigits] = useState<number | null>(null);
  const [input, setInput] = useState<string | null>(null);
  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();

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
    navigation.navigate(ScreenName.WalletSyncSuccess, { created: false });
    setDigits(null);
    setInput(null);
    setInputCallback(null);
  }, [navigation]);

  const handleStart = useCallback(
    (url: string, memberCredentials: MemberCredentials) => {
      return createQRCodeCandidateInstance({
        memberCredentials,
        scannedUrl: url,
        memberName: Platform.OS + " " + Platform.Version,
        onRequestQRCodeInput,
      })
        .then(trustchain => {
          dispatch(setTrustchain(trustchain));
          return true;
        })
        .catch(e => {
          if (e instanceof InvalidDigitsError) {
            console.warn("Invalid digits"); // We should open the error scene here
            return;
          }
          throw e;
        })
        .finally(() => {
          onSyncFinished();
        });
    },
    [onRequestQRCodeInput, dispatch, onSyncFinished],
  );

  const handleSendDigits = useCallback(
    (inputCallback: (_: string) => void, input: string) => (inputCallback(input), true),
    [],
  );

  return { digits, input, handleStart, handleSendDigits, setInput, inputCallback };
};
