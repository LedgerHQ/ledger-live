import React, { useState, memo, useCallback, useEffect, useRef } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { TFunction } from "i18next";
import { useAppsSections } from "@ledgerhq/live-common/apps/react";
import { State, Action } from "@ledgerhq/live-common/apps/types";
import { currenciesSelector } from "~/renderer/reducers/accounts";
import UpdateAllApps from "./UpdateAllApps";
import Placeholder from "./Placeholder";
import Card from "~/renderer/components/Box/Card";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import TabBar from "~/renderer/components/TabBar";
import Item from "./Item";
import Filter from "./Filter";
import Sort from "./Sort";
import UninstallAllButton from "./UninstallAllButton";
import { openModal } from "~/renderer/actions/modals";
import debounce from "lodash/debounce";
import InstallSuccessBanner from "./InstallSuccessBanner";
import SearchBox from "../../../accounts/AccountList/SearchBox";
import { App } from "@ledgerhq/types-live";
import { AppType, SortOptions } from "@ledgerhq/live-common/apps/filtering";
import NoResults from "~/renderer/icons/NoResults";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

// sticky top bar with extra width to cover card boxshadow underneath
export const StickyTabBar = styled.div`
  position: sticky;
  background-color: ${p => p.theme.colors.palette.background.default};
  top: -${p => p.theme.space[3]}px;
  left: 0;
  right: 0;
  padding: ${p => p.theme.space[3]}px ${p => p.theme.space[3]}px 0 ${p => p.theme.space[3]}px;
  margin-left: -${p => p.theme.space[3]}px;
  height: ${p => p.theme.sizes.topBarHeight}px;
  width: 100%;
  box-sizing: content-box;
  z-index: 1;
`;
const FilterHeader = styled.div<{ isIncomplete?: boolean }>`
  display: flex;
  flex-direction: row;
  padding: 10px 20px;
  margin: 0px;
  align-items: center;
  background-color: ${p => p.theme.colors.palette.background.paper};
  box-shadow: 0 1px 0 0 ${p => p.theme.colors.palette.text.shade10};
  border-radius: 4px 4px 0 0;
  position: sticky;
  top: ${p => (p.isIncomplete ? -p.theme.space[3] : p.theme.sizes.topBarHeight)}px;
  left: 0;
  right: 0;
  z-index: 1;
`;

type Props = {
  optimisticState: State;
  state: State;
  dispatch: (a: Action) => void;
  isIncomplete: boolean;
  setAppInstallDep?: (a: { app: App; dependencies: App[] }) => void;
  setAppUninstallDep?: (a: { dependents: App[]; app: App }) => void;
  t: TFunction;
};

const AppsList = ({
  optimisticState,
  state,
  dispatch,
  isIncomplete,
  setAppInstallDep,
  setAppUninstallDep,
  t,
}: Props) => {
  const { push } = useHistory();
  const { search } = useLocation();
  const reduxDispatch = useDispatch();
  const currenciesAccountsSetup = useSelector(currenciesSelector);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [appFilter, setFilter] = useState<AppType>("all");
  const [sort, setSort] = useState<SortOptions>({
    type: "marketcap",
    order: "desc",
  });
  const [activeTab, setActiveTab] = useState(0);
  const onTextChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setQuery(evt.target.value),
    [setQuery],
  );

  /** clear search field on tab change */
  useEffect(() => {
    setQuery("");
  }, [activeTab]);
  const isDeviceTab = activeTab === 1;

  /** retrieve search query from router location search params */
  useEffect(() => {
    const params = new URLSearchParams(search);
    const q = params.get("q");
    if (q) setQuery(q);
    if (inputRef.current && inputRef.current && inputRef.current.focus) inputRef.current.focus();
  }, [search]);
  const { installed: installedApps, uninstallQueue, apps } = state;
  const addAccount = useCallback(
    (currency?: CryptoOrTokenCurrency) => {
      push("/accounts");
      reduxDispatch(
        openModal("MODAL_ADD_ACCOUNTS", {
          currency: currency || null,
        }),
      );
    },
    [push, reduxDispatch],
  );
  const { update, device, catalog } = useAppsSections(state, {
    query,
    appFilter,
    sort,
  });

  const displayedAppList = isDeviceTab ? device : catalog;

  const mapApp = useCallback(
    (app: App, appStoreView: boolean, onlyUpdate?: boolean, showActions?: boolean) => {
      return (
        <Item
          optimisticState={optimisticState}
          state={state}
          key={`${appStoreView ? "APP_STORE" : "DEVICE_TAB"}_${app.name}`}
          app={app}
          installed={state.installed.find(({ name }) => name === app.name)}
          dispatch={dispatch}
          forceUninstall={isIncomplete}
          appStoreView={appStoreView}
          onlyUpdate={onlyUpdate}
          showActions={showActions}
          setAppInstallDep={setAppInstallDep}
          setAppUninstallDep={setAppUninstallDep}
          addAccount={addAccount}
        />
      );
    },
    [
      optimisticState,
      state,
      dispatch,
      isIncomplete,
      setAppInstallDep,
      setAppUninstallDep,
      addAccount,
    ],
  );
  return (
    <>
      <InstallSuccessBanner
        state={state}
        addAccount={addAccount}
        disabled={update.length >= 1 || !!currenciesAccountsSetup.length}
      />
      <UpdateAllApps
        optimisticState={optimisticState}
        update={update}
        state={state}
        dispatch={dispatch}
        isIncomplete={isIncomplete}
      />
      {isIncomplete ? null : (
        <StickyTabBar>
          <TabBar
            withId
            ids={["manager-app-catalog", "manager-installed-apps"]}
            tabs={[t("manager.tabs.appCatalog"), t("manager.tabs.appsOnDevice")]}
            onIndexChange={setActiveTab}
          />
        </StickyTabBar>
      )}
      <Card mt={0}>
        {isDeviceTab && !installedApps.length ? (
          <Box pb={6} pt={8} data-test-id="manager-no-apps-empty-state">
            <Box mb={4} mt={5} horizontal color="palette.text.shade30" justifyContent="center">
              <NoResults />
            </Box>
            <Text textAlign="center" ff="Inter|SemiBold" fontSize={6}>
              <Trans i18nKey="manager.applist.placeholderNoAppsInstalled" />
            </Text>
            <Text textAlign="center" fontSize={4}>
              <Trans i18nKey="manager.applist.placeholderGoToCatalog" />
            </Text>
          </Box>
        ) : (
          <>
            <FilterHeader isIncomplete={isIncomplete}>
              <Box flex="1" horizontal height={40}>
                <SearchBox
                  autoFocus
                  onTextChange={onTextChange}
                  search={query}
                  placeholder={t(
                    !isDeviceTab
                      ? "manager.tabs.appCatalogSearch"
                      : "manager.tabs.appOnDeviceSearch",
                  )}
                  ref={inputRef}
                />
              </Box>
              {!isDeviceTab ? (
                <>
                  <Filter onFilterChange={debounce(setFilter, 100)} filter={appFilter} />
                  <Box ml={3}>
                    <Sort onSortChange={debounce(setSort, 100)} sort={sort} />
                  </Box>
                </>
              ) : (
                <UninstallAllButton
                  installedApps={installedApps}
                  uninstallQueue={uninstallQueue}
                  dispatch={dispatch}
                />
              )}
            </FilterHeader>
            {displayedAppList.length ? (
              displayedAppList.map(app => mapApp(app, !isDeviceTab))
            ) : (
              <Placeholder
                query={query}
                addAccount={addAccount}
                dispatch={dispatch}
                installed={installedApps}
                apps={apps}
              />
            )}
          </>
        )}
      </Card>
    </>
  );
};

export default memo<Props>(AppsList);
