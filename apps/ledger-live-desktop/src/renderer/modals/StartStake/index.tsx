import perFamilyManageActions from "~/renderer/generated/AccountHeaderManageActions";
import { FC, useEffect } from "react";
import { useDispatch } from "react-redux";
import { closeModal } from "~/renderer/actions/modals";
import { Account } from "@ledgerhq/types-live";

type Action = {
  key: string;
  onClick: () => void;
};

type CurrencyFamily = keyof typeof perFamilyManageActions;

interface ModalStartStakeProps {
  account: Account;
  parentAccount: Account | null;
  alwaysShowNoFunds: boolean;
}

const ModalStartStake: FC<ModalStartStakeProps> = ({ account, parentAccount }) => {
  const currencyFamily: CurrencyFamily = account.currency.family as CurrencyFamily;
  const manage = perFamilyManageActions[currencyFamily];
  const dispatch = useDispatch();
  let manageList: Action[] = [];
  if (manage) {
    const familyManageActions = manage({ account, parentAccount });
    manageList = familyManageActions && familyManageActions.length > 0 ? familyManageActions : [];
  }

  useEffect(() => {
    const stakeAction = manageList.find(item => item.key === "Stake");
    dispatch(closeModal("MODAL_START_STAKE"));

    if (stakeAction) {
      stakeAction.onClick();
    }
    // ignoring manageList from dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  return null;
};

export default ModalStartStake;
