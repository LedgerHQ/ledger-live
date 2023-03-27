import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { canStake } from "@ledgerhq/live-common/families/near/logic";
import { Account, AccountLike } from "@ledgerhq/live-common/types/index";
import invariant from "invariant";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
type Props = {
  account: AccountLike;
  parentAccount: Account | undefined | null;
};
const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mainAccount = getMainAccount(account, parentAccount);
  const { nearResources } = mainAccount;
  invariant(nearResources, "near account expected");
  const stakingEnabled = canStake(mainAccount);
  const hasStakingPositions = nearResources.stakingPositions.length > 0;
  const onClick = useCallback(() => {
    if (!stakingEnabled) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
    } else {
      if (hasStakingPositions) {
        dispatch(
          openModal("MODAL_NEAR_STAKE", {
            account,
          }),
        );
      } else {
        dispatch(
          openModal("MODAL_NEAR_REWARDS_INFO", {
            account,
          }),
        );
      }
    }
  }, [stakingEnabled, dispatch, account, hasStakingPositions, parentAccount]);
  if (parentAccount) return null;
  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: IconCoins,
      label: t("account.stake"),
      event: "button_clicked",
      eventProperties: {
        button: "stake",
      },
    },
  ];
};
export default AccountHeaderActions;
