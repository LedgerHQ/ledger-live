import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Account } from "@ledgerhq/types-live";
import { useHistory } from "react-router-dom";
import { stakeDefaultTrack } from "./constants";
import { track, page } from "~/renderer/analytics/segment";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";

type Props = {
  currencies?: string[];
};

const useStakeFlow = (props: Props) => {
  const history = useHistory();
  const stakeProgramsFeatureFlag = useFeature("stakePrograms");
  const dispatch = useDispatch();
  const { params: paramsFlag } = stakeProgramsFeatureFlag || {};
  const { list: listFlag } = paramsFlag || {};

  const getStakeDrawer = currencies => {
    page("Stake", "Drawer - Choose Asset", {
      ...stakeDefaultTrack,
      page: history.location.pathname,
      type: "drawer",
    });
    setDrawer(
      SelectAccountAndCurrencyDrawer,
      {
        currencies: currencies || listFlag || [],
        onAccountSelected: (account: Account, parentAccount: Account | null = null) => {
          setDrawer();
          dispatch(openModal("MODAL_START_STAKE", { account, parentAccount }));
          history.push({
            pathname: `/account/${account.id}`,
          });
          track("button_clicked", {
            ...stakeDefaultTrack,
            button: "asset",
            page: history.location.pathname,
            currency: account?.currency?.family,
            account,
            parentAccount,
            drawer: "Select Account And Currency Drawer",
          });
        },
      },
      {
        onRequestClose: () => {
          setDrawer();
          track("button_clicked", {
            ...stakeDefaultTrack,
            button: "close",
            page: history.location.pathname,
            ...stakeDefaultTrack,
          });
        },
      },
    );
  };

  const getStakeFlow = () => {
    const { currencies } = props || {};
    getStakeDrawer(currencies);
  };

  return getStakeFlow;
};

export default useStakeFlow;
