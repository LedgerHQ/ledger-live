import { useCallback, useEffect, useState } from "react";
import { createQRCodeHostInstance } from "@ledgerhq/trustchain/qrcode/index";
import { InvalidDigitsError, NoTrustchainInitialized } from "@ledgerhq/trustchain/errors";
import { useDispatch, useSelector } from "react-redux";
import {
  trustchainSelector,
  memberCredentialsSelector,
  setTrustchain,
} from "@ledgerhq/trustchain/store";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { Options, Steps } from "../types/Activation";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import { useInstanceName } from "./useInstanceName";

interface Props {
  setCurrentStep: (step: Steps) => void;
  currentStep: Steps;
  currentOption: Options;
}

export function useQRCodeHost({ setCurrentStep, currentStep, currentOption }: Props) {
  const queryClient = useQueryClient();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const sdk = useTrustchainSdk();
  const dispatch = useDispatch();

  const featureWalletSync = useFeature("llmWalletSync");
  const { trustchainApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const memberName = useInstanceName();

  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [pinCode, setPinCode] = useState<string | null>(null);

  const navigation = useNavigation();

  const startQRCodeProcessing = useCallback(() => {
    if (!memberCredentials || isLoading) return;

    setError(null);
    setIsLoading(true);
    createQRCodeHostInstance({
      trustchainApiBaseUrl,
      onDisplayQRCode: url => {
        setUrl(url);
      },
      onDisplayDigits: digits => {
        setPinCode(digits);
        setCurrentStep(Steps.PinDisplay);
      },
      addMember: async member => {
        if (trustchain) {
          await sdk.addMember(trustchain, memberCredentials, member);
          return trustchain;
        }
        throw new NoTrustchainInitialized();
      },
      memberCredentials,
      memberName,
      alreadyHasATrustchain: !!trustchain,
    })
      .then(newTrustchain => {
        if (newTrustchain) {
          dispatch(setTrustchain(newTrustchain));
        }
        queryClient.invalidateQueries({ queryKey: [QueryKey.getMembers] });
        navigation.navigate(NavigatorName.WalletSync, {
          screen: ScreenName.WalletSyncLoading,
          params: {
            created: false,
          },
        });

        setUrl(null);
        setPinCode(null);
        setIsLoading(false);
      })
      .catch(e => {
        if (e instanceof InvalidDigitsError) {
          setCurrentStep(Steps.SyncError);
          return;
        } else if (e instanceof NoTrustchainInitialized) {
          setCurrentStep(Steps.UnbackedError);
          return;
        }
        setError(e);
        throw e;
      });
  }, [
    trustchain,
    memberCredentials,
    isLoading,
    trustchainApiBaseUrl,
    memberName,
    setCurrentStep,
    sdk,
    queryClient,
    navigation,
    dispatch,
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
