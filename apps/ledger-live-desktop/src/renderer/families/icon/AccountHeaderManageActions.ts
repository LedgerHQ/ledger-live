import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { getAccountUnit, getMainAccount } from "@ledgerhq/live-common/account/index";
import type { SubAccount, AccountLike } from "@ledgerhq/types-live";
import { IconAccount } from "@ledgerhq/live-common/families/icon/types";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import IconCoins from "~/renderer/icons/Coins";
import { localeSelector } from "~/renderer/reducers/settings";
import { BigNumber } from "bignumber.js";
import { IconFamily } from "./types";

type Props = {
  account: IconAccount | SubAccount;
  parentAccount: IconAccount | undefined | null;
  source?: string;
};
// type Props = {
//   account: AccountLike;
//   parentAccount: Account | undefined | null;
// };

const AccountHeaderManageActions: IconFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
  source = "Account Page",
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const locale = useSelector(localeSelector);
  const unit = getAccountUnit(account);
  const mainAccount = getMainAccount(account, parentAccount);
  const minAmount = 10 ** unit.magnitude;
  const { iconResources, spendableBalance } = mainAccount;
  const votingPower = iconResources?.votingPower ?? 0;
  const earnRewardDisabled = votingPower === 0 && spendableBalance.lt(minAmount);

  // const onClick = useCallback(() => {
  //   if (votingPower > 0 || iconResources.votes?.length > 0) {
  //     dispatch(
  //       openModal("MODAL_MANAGE_ICON", {
  //         parentAccount,
  //         account,
  //       }),
  //     );
  //   } else {
  //     dispatch(
  //       openModal("MODAL_ICON_REWARDS_INFO", {
  //         parentAccount,
  //         account,
  //       }),
  //     );
  //   }
  // }, [votingPower, iconResources.votes?.length, dispatch, parentAccount, account]);
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
          openModal("MODAL_MANAGE_ICON", {
            account,
            source,
          }),
        );
      }
    }
  }, [account, dispatch, parentAccount, source]);
  if (parentAccount) return null;

  const formattedMinAmount = formatCurrencyUnit(unit, BigNumber(minAmount), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    locale,
  });

  const disabledLabel = earnRewardDisabled
    ? `${t("icon.voting.warnEarnRewards", { amount: formattedMinAmount })}`
    : undefined;

  return [
    {
      key: "Stake",
      onClick: onClick,
      disabled: earnRewardDisabled,
      icon: IconCoins,
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

// const AccountHeaderActions = ({ account, parentAccount }: Props) => {
//   const mainAccount = getMainAccount(account, parentAccount);
//   const { iconResources } = mainAccount;
//   console.log("mainAccount", mainAccount);
//   console.log("iconResources", iconResources);
//   if (!iconResources) return null;

//   return AccountHeaderManageActionsComponent({ account, parentAccount, iconResources });
// };

// export default AccountHeaderActions;
// import { getMainAccount } from "@ledgerhq/live-common/account/index";
// import { Account, AccountLike } from "@ledgerhq/types-live";
// import { IconAccount } from "@ledgerhq/live-common/families/icon/types";
// import { useCallback } from "react";
// import { useDispatch } from "react-redux";
// import { useTranslation } from "react-i18next";
// import IconCoins from "~/renderer/icons/ClaimReward";
// import { openModal } from "~/renderer/actions/modals";
// import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
// type Props = {
//   account: AccountLike;
//   parentAccount: Account | undefined | null;
// };
// const AccountHeaderActions = ({ account, parentAccount }: Props) => {
//   const { t } = useTranslation();
//   const dispatch = useDispatch();
//   const onClick = useCallback(() => {
//     console.log("aaa", account);
//     if (isAccountEmpty(account)) {
//       dispatch(
//         openModal("MODAL_NO_FUNDS_STAKE", {
//           account,
//           parentAccount,
//         }),
//       );
//     } else if (account.type === "Account") {
//       dispatch(
//         openModal("MODAL_ETH_STAKE", {
//           account,
//         }),
//       );
//     }
//   }, [account, dispatch, parentAccount]);
//   if (account.type === "Account" && account.currency.id === "ethereum") {
//     return [
//       {
//         key: "Stake",
//         onClick,
//         event: "button_clicked",
//         eventProperties: {
//           button: "stake",
//         },
//         icon: IconCoins,
//         label: t("account.stake", {
//           currency: account?.currency?.name,
//         }),
//         accountActionsTestId: "stake-from-account-action-button",
//       },
//     ];
//   } else {
//     return [];
//   }
// };
// export default AccountHeaderActions;
