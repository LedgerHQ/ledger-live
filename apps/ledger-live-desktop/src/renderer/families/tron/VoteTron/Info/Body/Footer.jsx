// @flow
import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { openModal, closeModal } from "~/renderer/actions/modals";
import Button from "~/renderer/components/Button";
import { useAccount } from "../shared";

export default function VoteTronInfoModalBodyFooter() {
  const { t } = useTranslation();

  const accountContext = useAccount();

  const tronResources =
    accountContext &&
    accountContext.account &&
    accountContext.account.type === "Account" &&
    accountContext.account.tronResources;

  const hasVotesAvailable = tronResources ? tronResources.tronPower > 0 : false;

  const dispatch = useDispatch();
  const onNext = useCallback(() => {
    if (!accountContext) {
      return;
    }
    const { name, account, parentAccount } = accountContext;

    dispatch(closeModal(name));
    dispatch(
      openModal("MODAL_TRON_VOTE", {
        parentAccount,
        account,
      }),
    );
  }, [accountContext, dispatch]);

  return (
    <>
      <Button primary disabled={!hasVotesAvailable} onClick={onNext}>
        {t("tron.manage.vote.steps.vote.footer.next")}
      </Button>
    </>
  );
}
