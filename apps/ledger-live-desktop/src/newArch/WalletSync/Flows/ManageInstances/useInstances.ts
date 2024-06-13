import { useDispatch } from "react-redux";
import { addInstance, removeAllInstances, removeInstance } from "~/renderer/actions/walletSync";

import { useGetMembers } from "../../useTrustchainSdk";
import { TrustchainMember } from "@ledgerhq/trustchain/types";

export const useInstances = () => {
  const dispatch = useDispatch();

  const deleteInstance = (instance: TrustchainMember) => dispatch(removeInstance(instance));

  const createInstance = (instance: TrustchainMember) => dispatch(addInstance(instance));

  const deleteAllInstances = () => dispatch(removeAllInstances);

  const { isMembersLoading, instances } = useGetMembers();

  return {
    isLoading: isMembersLoading,
    instances,
    deleteInstance,
    deleteAllInstances,
    createInstance,
  };
};
