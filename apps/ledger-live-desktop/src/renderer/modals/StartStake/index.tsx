import { FC, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "~/renderer/actions/modals";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getLLDCoinFamily } from "~/renderer/families";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useStake } from "~/newArch/hooks/useStake";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useHistory } from "react-router-dom";

type Action = {
  key: string;
  onClick?: () => void;
};

export interface ModalStartStakeProps {
  account: AccountLike;
  parentAccount?: Account | undefined | null;
  alwaysShowNoFunds?: boolean;
  source?: string;
}

const ModalStartStake: FC<ModalStartStakeProps> = ({ account, parentAccount, source }) => {
  const { getRouteToPlatformApp } = useStake();
  const history = useHistory();
  const walletState = useSelector(walletSelector);

  const currencyFamily = getMainAccount(account, parentAccount).currency.family;
  const manage = getLLDCoinFamily(currencyFamily).accountHeaderManageActions;
  const dispatch = useDispatch();
  let manageList: Action[] = [];
  if (manage) {
    const familyManageActions = manage({ account, parentAccount, source });
    manageList = familyManageActions && familyManageActions.length > 0 ? familyManageActions : [];
  }

  useEffect(() => {
    const platformAppRoute = getRouteToPlatformApp(account, walletState, parentAccount);

    if (platformAppRoute) {
      // Redirect to the platform app preferentially
      dispatch(closeModal("MODAL_START_STAKE"));
      history.push(platformAppRoute);
      return;
    }

    const stakeAction = manageList.find(item => item.key === "Stake");
    dispatch(closeModal("MODAL_START_STAKE"));

    if (stakeAction) {
      stakeAction.onClick?.();
    }
    // ignoring manageList from dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  return null;
};

export default ModalStartStake;
