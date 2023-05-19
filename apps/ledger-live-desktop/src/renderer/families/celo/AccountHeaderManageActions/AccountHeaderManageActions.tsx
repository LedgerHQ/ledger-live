import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { isAccountRegistrationPending } from "@ledgerhq/live-common/families/celo/logic";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { openModal } from "~/renderer/actions/modals";
import Icon from "./Icon";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { CeloFamily } from "../types";
import { CeloAccount } from "@ledgerhq/live-common/families/celo/types";

const AccountHeaderManageActions: CeloFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
  source = "Account Page",
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector) as CeloAccount[]; // FIXME: Celo Account
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
      if (account.type === "Account") {
        dispatch(
          openModal("MODAL_CELO_MANAGE", {
            account,
            source,
          }),
        );
      }
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
