import { useState, useEffect, useMemo } from "react";
import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Account } from "@ledgerhq/types-live";
import perFamilyManageActions from "~/renderer/generated/AccountHeaderManageActions";
import { useHistory } from "react-router-dom";
import { stakeDefaultTrack } from "./constants";
import { track, page } from "~/renderer/analytics/segment";

type Props = {
  account?: Account;
  parentAccount?: Account | null;
};

type CurrencyTypes = keyof typeof perFamilyManageActions;

const useStakeFlow = (props: Props) => {
  const history = useHistory();
  const [accountSelection, setAccountSelection] = useState<Props>({});
  const stakeProgramsFeatureFlag = useFeature("stakePrograms");
  const { params: paramsFlag, enabled: stakeProgramsEnabled } = stakeProgramsFeatureFlag || {};
  const { list: listFlag } = paramsFlag || {};
  const { account = {} as Account, parentAccount = null } = accountSelection;
  const family: CurrencyTypes = (account?.currency?.family as CurrencyTypes) || "ethereum";
  const useManage = perFamilyManageActions[family];
  const familyManageActions = useManage({ account, parentAccount });

  const action = useMemo(() => {
    const manageList =
      familyManageActions && familyManageActions.length > 0 ? familyManageActions : [];
    return manageList && manageList.find(item => item.key === "Stake");
  }, [familyManageActions]);

  useEffect(() => {
    if (action && action.onClick) {
      action.onClick();
      history.push({
        pathname: `/account/${account.id}`,
      });
    }
  }, [account.id, action, history]);

  const getStakeDrawer = () => {
    page("Stake", "Drawer - Choose Asset", {
      page: history.location.pathname,
      ...stakeDefaultTrack,
    });
    setDrawer(
      SelectAccountAndCurrencyDrawer,
      {
        currencies: listFlag || [],
        onAccountSelected: (account: Account, parentAccount: Account | null = null) => {
          setDrawer();
          setAccountSelection({ account, parentAccount });
          track("button_clicked", {
            button: "asset",
            page: history.location.pathname,
            currency: account?.currency?.family,
            account,
            parentAccount,
            ...stakeDefaultTrack,
          });
        },
      },
      {
        onRequestClose: () => {
          setDrawer();
          track("button_clicked", {
            button: "close",
            page: history.location.pathname,
            currency: account?.currency?.family,
            account,
            parentAccount,
            ...stakeDefaultTrack,
          });
        },
      },
    );
  };

  const getStakeFlow = () => {
    if (props.account && props.parentAccount) {
      setAccountSelection(props);
    } else if (stakeProgramsEnabled) {
      getStakeDrawer();
    }
  };

  return getStakeFlow;
};

export default useStakeFlow;
