import React, { useCallback, useEffect } from "react";
import Loading from "../../components/LoadingStep";
import { useTranslation } from "react-i18next";
import { Flow, Instance, Step } from "~/renderer/reducers/walletSync";
import { useInstances } from "./useInstances";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";

type Props = {
  instance: Instance | null;
};

export default function DeleteInstanceWithTrustchain({ instance }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { deleteInstance } = useInstances();

  // TO CHANGE WHEN INTRAGRATION WITH TRUSTCHAIN
  const stuffHandledByTrustchain = useCallback(() => {
    dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceSuccesfullyDeleted }));
    deleteInstance(instance as Instance);

    //IF ERROR
    // dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceErrorDeletion }));
  }, [deleteInstance, dispatch, instance]);

  // TO CHANGE WHEN INTRAGRATION WITH TRUSTCHAIN
  useEffect(() => {
    setTimeout(() => {
      stuffHandledByTrustchain();
    }, 3000);
  }, [stuffHandledByTrustchain]);

  return <Loading title={t("walletSync.loading.title")} subtitle={t("walletSync.loading.synch")} />;
}
