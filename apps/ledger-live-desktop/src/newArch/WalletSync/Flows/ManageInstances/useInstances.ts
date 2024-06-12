import { useState } from "react";
import { useDispatch } from "react-redux";
import { addInstance, removeAllInstances, removeInstance } from "~/renderer/actions/walletSync";
import { Instance } from "~/renderer/reducers/walletSync";
import { useGetMembers } from "../../useTrustchainSdk";
import { TrustchainMember } from "@ledgerhq/trustchain/types";

export const useInstances = () => {
  const [selectedInstance, setSelectedInstance] = useState<TrustchainMember | null>(null);
  const dispatch = useDispatch();

  const deleteInstance = (instance: Instance) => dispatch(removeInstance(instance));

  const createInstance = (instance: Instance) => dispatch(addInstance(instance));

  const deleteAllInstances = () => dispatch(removeAllInstances);

  const { isMembersLoading, instances } = useGetMembers();

  return {
    isLoading: isMembersLoading,
    instances,
    deleteInstance,
    deleteAllInstances,
    createInstance,
    selectedInstance,
    setSelectedInstance,
  };
};
