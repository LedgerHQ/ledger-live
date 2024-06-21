import { useSelector } from "react-redux";
import { useGetMembers } from "../../useTrustchainSdk";
import { walletSyncFakedSelector } from "~/renderer/reducers/walletSync";

export const useInstances = () => {
  const hasBeenfaked = useSelector(walletSyncFakedSelector);

  const { isMembersLoading, instances, isError } = useGetMembers();

  return {
    isLoading: hasBeenfaked ? false : isMembersLoading,
    instances: hasBeenfaked ? [] : instances,
    hasError: hasBeenfaked ? false : isError,
  };
};
