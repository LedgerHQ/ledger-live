import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { areEarnRewardsEnabled } from "@ledgerhq/live-common/families/elrond/helpers/areEarnRewardsEnabled";
import { useElrondRandomizedValidators } from "@ledgerhq/live-common/families/elrond/react";
import { modals } from "./modals";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { Account, AccountLike } from "@ledgerhq/types-live";
type Props = {
  account: AccountLike;
  parentAccount: Account | undefined | null;
};
const AccountHeaderActions = (props: Props) => {
  const { account, parentAccount } = props;
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const validators = useElrondRandomizedValidators();
  const earnRewardEnabled = useMemo(() => areEarnRewardsEnabled(account), [account]);
  const hasDelegations = account.elrondResources
    ? account.elrondResources.delegations.length > 0
    : false;
  const onClick = useCallback(() => {
    if (!earnRewardEnabled) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
    } else if (hasDelegations) {
      dispatch(
        openModal(modals.stake, {
          account,
          validators,
        }),
      );
    } else {
      dispatch(
        openModal(modals.rewards, {
          account,
          validators,
        }),
      );
    }
  }, [account, earnRewardEnabled, hasDelegations, dispatch, parentAccount, validators]);
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
