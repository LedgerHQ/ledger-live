import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addInstance, removeAllInstances, removeInstance } from "~/renderer/actions/walletSync";
import { Instance, walletSyncInstancesSelector } from "~/renderer/reducers/walletSync";

export const useInstances = () => {
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const dispatch = useDispatch();
  const instances = useSelector(walletSyncInstancesSelector);

  const deleteInstance = (instance: Instance) => dispatch(removeInstance(instance));

  const createInstance = (instance: Instance) => dispatch(addInstance(instance));

  const deleteAllInstances = () => dispatch(removeAllInstances);

  return {
    instances,
    deleteInstance,
    deleteAllInstances,
    createInstance,
    selectedInstance,
    setSelectedInstance,
  };
};
