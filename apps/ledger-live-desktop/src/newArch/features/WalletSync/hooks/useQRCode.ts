import { useCallback, useState } from "react";
import { createQRCodeHostInstance } from "@ledgerhq/trustchain/qrcode/index";
import { InvalidDigitsError } from "@ledgerhq/trustchain/errors";
import { useDispatch, useSelector } from "react-redux";
import { setFlow, setQrCodePinCode } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { trustchainSelector, memberCredentialsSelector } from "@ledgerhq/trustchain/store";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

export function useQRCode() {
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

  const goToActivation = useCallback(() => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
  }, [dispatch]);

  const startQRCodeProcessing = useCallback(() => {
    if (!trustchain || !memberCredentials) return;

    setError(null);
    setIsLoading(true);
    createQRCodeHostInstance({
      trustchainApiBaseUrl,
      onDisplayQRCode: url => {
        setUrl(url);
        setIsLoading(false);
      },
      onDisplayDigits: digits => {
        dispatch(setQrCodePinCode(digits));
        dispatch(setFlow({ flow: Flow.Synchronize, step: Step.PinCode }));
      },
      addMember: async member => {
        await sdk.addMember(trustchain, memberCredentials, member);
        return trustchain;
      },
    })
      .catch(e => {
        if (e instanceof InvalidDigitsError) {
          return;
        }
        setError(e);
        setIsLoading(false);
      })
      .then(() => {
        setUrl(null);
        dispatch(setQrCodePinCode(null));
        setIsLoading(false);
        dispatch(setFlow({ flow: Flow.Synchronize, step: Step.Synchronized }));
      });
  }, [trustchainApiBaseUrl, trustchain, memberCredentials, dispatch, sdk]);

  return {
    url,
    error,
    isLoading,
    startQRCodeProcessing,
    goToActivation,
  };
}
