// @flow

import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { openModal } from "~/renderer/actions/modals";
import { isAccountRegistrationPending } from "../utils";
import Icon from "./Icon";
import type { Account } from "@ledgerhq/live-common/types";

type Props = {
  account: Account,
};

const AccountHeaderManageActions = ({ account }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const isRegistrationPending = isAccountRegistrationPending(account.id, accounts);

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
      icon: (props: *) => <Icon {...props} isDisabled={isRegistrationPending} />,
      disabled: isRegistrationPending,
      label: isRegistrationPending
        ? t("celo.manage.titleWhenPendingRegistration")
        : t("celo.manage.title"),
    },
  ];
};

export default AccountHeaderManageActions;
