// @flow

import { useCallback } from "react";
import { useDispatch } from "react-redux";
import type { Account } from "@ledgerhq/live-common/types";
import { openModal } from "~/renderer/actions/modals";
import { useTranslation } from "react-i18next";
import Icon from "./Icon";

type Props = {
  account: Account,
};

const AccountHeaderManageActions = ({ account }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onClick = useCallback(() => {
    dispatch(
      openModal("MODAL_CELO_MANAGE", {
        account,
      }),
    );
  }, [dispatch, account]);

  return [
    {
      key: "celo",
      onClick: onClick,
      icon: Icon,
      disabled: false,
      label: t("celo.manage.title"),
    },
  ];
};

export default AccountHeaderManageActions;
