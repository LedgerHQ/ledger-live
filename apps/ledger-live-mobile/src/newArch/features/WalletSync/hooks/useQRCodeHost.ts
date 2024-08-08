import { useCallback, useEffect, useState } from "react";
import { createQRCodeHostInstance } from "@ledgerhq/trustchain/qrcode/index";
import { InvalidDigitsError } from "@ledgerhq/trustchain/errors";
import { useSelector } from "react-redux";
import { trustchainSelector, memberCredentialsSelector } from "@ledgerhq/trustchain/store";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { Options, Steps } from "../types/Activation";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

interface Props {
  setCurrentStep: (step: Steps) => void;
  currentStep: Steps;
  currentOption: Options;
}

export function useQRCodeHost({ setCurrentStep, currentStep, currentOption }: Props) {
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const sdk = useTrustchainSdk();

  const featureWalletSync = useFeature("llmWalletSync");
  const { trustchainApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [pinCode, setPinCode] = useState<string | null>(null);

  const navigation = useNavigation();

  const startQRCodeProcessing = useCallback(() => {
    if (!trustchain || !memberCredentials || isLoading) return;

    let hasCompleted = false;

    setError(null);
    setIsLoading(true);
    createQRCodeHostInstance({
      trustchainApiBaseUrl,
      onDisplayQRCode: url => {
        setUrl(url);

        //TODO-remove when clearing code, used to test behavior with webTool
        // eslint-disable-next-line no-console
        console.log("onDisplayQRCode", url);
      },
      onDisplayDigits: digits => {
        setPinCode(digits);
        setCurrentStep(Steps.PinDisplay);
      },
      addMember: async member => {
        await sdk.addMember(trustchain, memberCredentials, member);
        hasCompleted = true;
        return trustchain;
      },
    })
      .catch(e => {
        if (e instanceof InvalidDigitsError) {
          setCurrentStep(Steps.SyncError);
          return;
        }
        setError(e);
      })
      .then(() => {
        if (!error && hasCompleted)
          navigation.navigate(NavigatorName.WalletSync, {
            screen: ScreenName.WalletSyncSuccess,
            params: {
              created: false,
            },
          });
      })
      .finally(() => {
        setUrl(null);
        setPinCode(null);
        setIsLoading(false);
      });
  }, [
    trustchain,
    memberCredentials,
    isLoading,
    trustchainApiBaseUrl,
    setCurrentStep,
    sdk,
    error,
    navigation,
  ]);

  useEffect(() => {
    if (currentStep === Steps.QrCodeMethod && currentOption === Options.SHOW_QR) {
      startQRCodeProcessing();
    }
  }, [currentOption, currentStep, startQRCodeProcessing]);

  return {
    url,
    error,
    isLoading,
    startQRCodeProcessing,
    pinCode,
  };
}
