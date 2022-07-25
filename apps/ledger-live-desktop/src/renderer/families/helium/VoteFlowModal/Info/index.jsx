// @flow
import type { Account, AccountLike } from "@ledgerhq/live-common/types/index";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { closeModal, openModal } from "~/renderer/actions/modals";
import WarnBox from "~/renderer/components/WarnBox";
import VoteFlowModal from "./VoteFlowModal";

type Props = {
  name?: string,
  account: AccountLike,
  parentAccount: ?Account,
};

export default function HeliumVoteInfoModal({ name, account, parentAccount }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    dispatch(closeModal(name));
    dispatch(
      openModal("MODAL_HELIUM_VOTE", {
        parentAccount,
        account,
      }),
    );
  }, [parentAccount, account, dispatch, name]);

  return (
    <VoteFlowModal
      name={name}
      onNext={onNext}
      description={t("helium.votes.voteInfo.description")}
      bullets={[
        t("helium.votes.voteInfo.bullet.0"),
        t("helium.votes.voteInfo.bullet.1"),
        t("helium.votes.voteInfo.bullet.2"),
      ]}
      additional={<WarnBox>{t("helium.votes.voteInfo.warning")}</WarnBox>}
    />
  );
}
