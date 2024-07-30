import { useSelector } from "react-redux";
import {
  walletSyncFakedSelector,
  walletSyncInstancesSelector,
} from "~/renderer/reducers/walletSync";
import { useGetMembers } from "../../hooks/useGetMembers";

export const useInstances = () => {
  const hasBeenfaked = useSelector(walletSyncFakedSelector);

  const fakedInstances = useSelector(walletSyncInstancesSelector);

  const { isMembersLoading, instances, isError, error } = useGetMembers();

  return {
    isLoading: hasBeenfaked ? false : isMembersLoading,
    instances: hasBeenfaked ? fakedInstances : instances,
    hasError: hasBeenfaked ? false : isError,
    error: hasBeenfaked ? null : error,
  };
};
