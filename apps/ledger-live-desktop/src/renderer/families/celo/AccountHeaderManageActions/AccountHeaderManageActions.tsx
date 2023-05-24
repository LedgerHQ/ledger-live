import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { isAccountRegistrationPending } from "@ledgerhq/live-common/families/celo/logic";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { openModal } from "~/renderer/actions/modals";
import Icon from "./Icon";
import { Account } from "@ledgerhq/types-live";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
type Props = {
  account: Account;
  parentAccount: Account | undefined | null;
  source?: string;
};
const AccountHeaderManageActions = ({ account, parentAccount, source = "Account Page" }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const isRegistrationPending = isAccountRegistrationPending(account.id, accounts);
  const onClick = useCallback(() => {
    if (isAccountEmpty(account)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_CELO_MANAGE", {
          account,
          source,
        }),
      );
    }
  }, [account, dispatch, parentAccount, source]);
  const disabledLabel = isRegistrationPending
    ? `${t("celo.manage.titleWhenPendingRegistration")}`
    : "";
  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: (props: any) => <Icon {...props} isDisabled={isRegistrationPending} />,
      disabled: isRegistrationPending,
      label: t("account.stake"),
      tooltip: disabledLabel,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
      },
    },
  ];
};
export default AccountHeaderManageActions;
