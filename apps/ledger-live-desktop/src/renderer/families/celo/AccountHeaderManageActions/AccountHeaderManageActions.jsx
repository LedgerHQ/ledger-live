// @flow

import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { isAccountRegistrationPending } from "@ledgerhq/live-common/families/celo/logic";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { openModal } from "~/renderer/actions/modals";
import Icon from "./Icon";
import type { Account } from "@ledgerhq/types-live";

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
