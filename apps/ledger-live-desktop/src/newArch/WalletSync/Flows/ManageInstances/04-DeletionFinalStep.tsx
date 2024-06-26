import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { FinalStepProps } from "./04-DeletionFinalErrorStep";

export default function DeletionFinalStep({ instance }: FinalStepProps) {
  const { t } = useTranslation();
  const title = "walletSync.manageInstances.deleteInstanceSuccess";
  return (
    <Success
      title={t(title, {
        instanceName: instance?.name,
      })}
    />
  );
}
