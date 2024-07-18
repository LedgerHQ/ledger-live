import { memberCredentialsSelector, setMemberCredentials } from "@ledgerhq/trustchain/store";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTrustchainSdk } from "./useTrustchainSdk";

export function useInitMemberCredentials() {
  const sdk = useTrustchainSdk();
  const dispatch = useDispatch();

  const memberCredentials = useSelector(memberCredentialsSelector);

  const generateMemberCredentials = useCallback(async () => {
    if (!memberCredentials) {
      const newMemberCredentials = await sdk.initMemberCredentials();
      dispatch(setMemberCredentials(newMemberCredentials));
    }
  }, [memberCredentials, sdk, dispatch]);

  useEffect(() => {
    generateMemberCredentials();
  }, [generateMemberCredentials]);

  return { memberCredentials, generateMemberCredentials };
}
