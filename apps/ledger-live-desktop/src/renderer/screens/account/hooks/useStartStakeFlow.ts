import perFamilyManageActions from "~/renderer/generated/AccountHeaderManageActions";
import { useEffect } from "react";
import { Account } from "@ledgerhq/types-live";
import { useLocation, useHistory } from "react-router-dom";

type Action = {
  key: string;
  onClick: () => void;
};

type ActionKey = keyof typeof perFamilyManageActions;
export const useStartStakeFlow = (account: Account, parentAccount: Account | null) => {
  const { state } = useLocation<{ startStake: boolean }>();
  const history = useHistory();

  const manage = perFamilyManageActions[account.currency.family as ActionKey];
  let manageList: Action[] = [];
  if (manage) {
    const familyManageActions = manage({ account, parentAccount });
    manageList = familyManageActions && familyManageActions.length > 0 ? familyManageActions : [];
  }

  useEffect(() => {
    const stakeAction = manageList.find(item => item.key === "Stake");

    if (stakeAction && state?.startStake) {
      history.replace({});
      stakeAction.onClick();
    }
    // ignoring manageList from dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.startStake]);
};
