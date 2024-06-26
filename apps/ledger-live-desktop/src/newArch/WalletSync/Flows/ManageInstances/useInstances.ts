import { useSelector } from "react-redux";
import { walletSyncFakedSelector } from "~/renderer/reducers/walletSync";
import { useGetMembers } from "../../hooks/useGetMembers";

export const useInstances = () => {
  const hasBeenfaked = useSelector(walletSyncFakedSelector);

  const { isMembersLoading, instances, isError } = useGetMembers();

  return {
    isLoading: hasBeenfaked ? false : isMembersLoading,
    instances: hasBeenfaked ? [] : instances,
    hasError: hasBeenfaked ? false : isError,
  };
};
