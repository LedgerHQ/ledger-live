// @flow
import React from "react";
import { useTranslation } from "react-i18next";
import { ModalBody } from "~/renderer/components/Modal";
import VoteIconInfoModalBodyMain from "./Main";
import VoteIconInfoModalBodyFooter from "./Footer";

type Props = {
  onClose: () => void;
};

export default function VoteIconInfoModalBody({ onClose }: Props) {
  const { t } = useTranslation();

  return (
    <ModalBody
      title={t("icon.manage.vote.steps.vote.title")}
      onClose={onClose}
      noScroll
      render={() => <VoteIconInfoModalBodyMain />}
      renderFooter={() => <VoteIconInfoModalBodyFooter />}
    />
  );
}
