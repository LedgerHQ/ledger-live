import { memberCredentialsSelector, trustchainSelector } from "@ledgerhq/trustchain/store";
import { useSelector } from "react-redux";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "./type.hooks";
import { useTranslation } from "react-i18next";
import { createCustomErrorClass } from "@ledgerhq/errors";

export const TrustchainNotFound = createCustomErrorClass("TrustchainNotFound");
export const MemberCredentialsNotFound = createCustomErrorClass("MemberCredentialsNotFound");

export function useGetMembers() {
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const { t } = useTranslation();

  function getMembers() {
    if (!memberCredentials) {
      throw new MemberCredentialsNotFound(
        t("walletSync.walletSyncActivated.errors.memberCredentials"),
      );
    }

    if (!trustchain) {
      throw new TrustchainNotFound(t("walletSync.walletSyncActivated.errors.trustchain"));
    }

    try {
      return sdk.getMembers(trustchain, memberCredentials);
    } catch (e) {
      throw e as Error;
    }
  }

  return useQuery({
    queryKey: [QueryKey.getMembers, trustchain],
    queryFn: () => getMembers(),
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
