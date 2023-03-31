import { useCallback } from "react";
import { listCurrencies, filterCurrencies } from "@ledgerhq/live-common/currencies/helpers";
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
  shouldRedirect?: boolean;
  alwaysShowNoFunds?: boolean;
};

const useStakeFlow = () => {
  const history = useHistory();
  const { params: { list } = { list: undefined } } = useFeature("stakePrograms") || {};
  const dispatch = useDispatch();

  return useCallback(
    ({ currencies, shouldRedirect = true, alwaysShowNoFunds = false }: Props = {}) => {
      const cryptoCurrencies = filterCurrencies(listCurrencies(true), {
        currencies: currencies || list,
      });

      page("Stake", "Drawer - Choose Asset", {
        ...stakeDefaultTrack,
        page: history.location.pathname,
        type: "drawer",
      });
      setDrawer(
        SelectAccountAndCurrencyDrawer,
        {
          currencies: cryptoCurrencies,
          onAccountSelected: (account: Account, parentAccount: Account | null = null) => {
            track("button_clicked", {
              ...stakeDefaultTrack,
              button: "asset",
              page: history.location.pathname,
              currency: account?.currency?.family,
              account,
              parentAccount,
              drawer: "Select Account And Currency Drawer",
            });
            setDrawer();

            if (alwaysShowNoFunds) {
              dispatch(openModal("MODAL_NO_FUNDS_STAKE", { account, parentAccount }));
            } else {
              dispatch(openModal("MODAL_START_STAKE", { account, parentAccount }));
            }

            if (shouldRedirect) {
              history.push({
                pathname: `/account/${account.id}`,
              });
            }
          },
        },
        {
          onRequestClose: () => {
            setDrawer();
            track("button_clicked", {
              ...stakeDefaultTrack,
              button: "close",
              page: history.location.pathname,
            });
          },
        },
      );
    },
    [dispatch, history, list],
  );
};

export default useStakeFlow;
