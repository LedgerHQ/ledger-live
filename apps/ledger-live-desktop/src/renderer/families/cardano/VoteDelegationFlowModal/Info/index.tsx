import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { openModal, closeModal } from "~/renderer/actions/modals";
import VoteDelegationInfoModal from "./VoteDelegationInfoModal";
import { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";

export type VoteDelegationInfoModalProps = {
  account: CardanoAccount;
};

export default function CardanoVoteDelegationInfoModal({ account }: VoteDelegationInfoModalProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(
    (option: "dRep" | "noConfidence" | "abstain") => {
      dispatch(closeModal("MODAL_CARDANO_VOTE_DELEGATION_INFO"));
      dispatch(
        openModal("MODAL_CARDANO_VOTE_DELEGATION", {
          account,
          option: option,
        }),
      );
    },
    [account, dispatch],
  );

  return (
    <VoteDelegationInfoModal
      name="MODAL_CARDANO_VOTE_DELEGATION_INFO"
      onNext={onNext}
      description={t("cardano.voteDelegation.flow.steps.starter.description")}
      bullets={[
        t("cardano.voteDelegation.flow.steps.starter.bullet.0"),
        t("cardano.voteDelegation.flow.steps.starter.bullet.1"),
        t("cardano.voteDelegation.flow.steps.starter.bullet.2"),
      ]}
      currency="cardano"
      additional={null}
      hideFooterButtons={true}
    />
  );
}
