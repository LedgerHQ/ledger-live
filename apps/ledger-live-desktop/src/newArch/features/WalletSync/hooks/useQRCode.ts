import { useCallback, useState } from "react";
import { createQRCodeHostInstance } from "@ledgerhq/trustchain/qrcode/index";
import { InvalidDigitsError, NoTrustchainInitialized } from "@ledgerhq/trustchain/errors";
import { useDispatch, useSelector } from "react-redux";
import { setFlow, setQrCodePinCode } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import {
  trustchainSelector,
  memberCredentialsSelector,
  setTrustchain,
} from "@ledgerhq/trustchain/store";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import { useInstanceName } from "./useInstanceName";

export function useQRCode() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const sdk = useTrustchainSdk();
  const featureWalletSync = useFeature("lldWalletSync");
  const { trustchainApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const memberName = useInstanceName();

  const goToActivation = useCallback(() => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
  }, [dispatch]);

  const startQRCodeProcessing = useCallback(() => {
    if (!memberCredentials) return;

    setError(null);
    setIsLoading(true);
    createQRCodeHostInstance({
      trustchainApiBaseUrl,
      onDisplayQRCode: url => {
        setUrl(url);
      },
      onDisplayDigits: digits => {
        dispatch(setQrCodePinCode(digits));
        dispatch(setFlow({ flow: Flow.Synchronize, step: Step.PinCode }));
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
      .catch(e => {
        if (e instanceof InvalidDigitsError) {
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.PinCodeError }));
        } else if (e instanceof NoTrustchainInitialized) {
          dispatch(setFlow({ flow: Flow.Synchronize, step: Step.UnbackedError }));
        }
        setError(e);
        throw e;
      })
      .then(newTrustchain => {
        if (newTrustchain) {
          dispatch(setTrustchain(newTrustchain));
        }
        dispatch(setFlow({ flow: Flow.Synchronize, step: Step.Synchronized }));
        queryClient.invalidateQueries({ queryKey: [QueryKey.getMembers] });
        setUrl(null);
        dispatch(setQrCodePinCode(null));
        setIsLoading(false);
        setError(null);
      });
  }, [memberCredentials, trustchainApiBaseUrl, memberName, dispatch, trustchain, sdk, queryClient]);

  return {
    url,
    error,
    isLoading,
    startQRCodeProcessing,
    goToActivation,
  };
}
