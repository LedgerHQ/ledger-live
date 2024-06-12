import React, { useEffect } from "react";
import Loading from "../../components/LoadingStep";
import { useTranslation } from "react-i18next";
import { useRemoveMembers } from "../../useTrustchainSdk";
import { TrustchainMember } from "@ledgerhq/trustchain/types";

type Props = {
  instance: TrustchainMember | null;
};

export default function DeleteInstanceWithTrustchain({ instance }: Props) {
  const { t } = useTranslation();

  const removeMemberMutation = useRemoveMembers();

  useEffect(() => {
    if (instance) {
      removeMemberMutation.mutateAsync(instance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Loading title={t("walletSync.loading.title")} subtitle={t("walletSync.loading.synch")} />;
}
