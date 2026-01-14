import React from "react";
import { Observable, EMPTY } from "rxjs";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

type Mocks = {
  replace: jest.Mock;
  navigate: jest.Mock;
  goBack: jest.Mock;
  pop: jest.Mock;
  setRouteParams: (currencyId: string, deviceId?: string) => void;
  setScanObservable: (observable: Observable<ScanAccountEvent>) => void;
  makeDiscoveredEvent: (account: Account) => ScanAccountEvent;
  resetSpies: () => void;
  getCurrentCurrency: () => Account["currency"];
};

let routeParams = {
  currency: getCryptoCurrencyById("ethereum"),
  device: { deviceId: "device-1" },
};

let scanAccountsObservable: Observable<ScanAccountEvent> = EMPTY;

const replace = jest.fn();
const navigate = jest.fn();
const goBack = jest.fn();
const pop = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  const useNavigationIndependentTreeMock = actual.useNavigationIndependentTree || (() => ({}));

  return {
    ...actual,
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useNavigationIndependentTree: useNavigationIndependentTreeMock,
  };
});

jest.mock("@react-navigation/core", () => ({
  useNavigation: () => ({
    replace,
    navigate,
    goBack,
    getParent: () => ({ pop }),
  }),
  useRoute: () => ({
    params: routeParams,
  }),
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getCurrencyBridge: jest.fn(() => ({
    scanAccounts: jest.fn(() => scanAccountsObservable),
    preload: jest.fn(() => Promise.resolve(undefined)),
    hydrate: jest.fn(),
  })),
}));

jest.mock("~/bridge/cache", () => ({
  prepareCurrency: jest.fn().mockResolvedValue(undefined),
}));

export const setupScanDeviceTests = (): Mocks => {
  const setRouteParams = (currencyId: string, deviceId = "device-1") => {
    routeParams = {
      currency: getCryptoCurrencyById(currencyId),
      device: { deviceId },
    };
  };

  const setScanObservable = (observable: Observable<ScanAccountEvent>) => {
    scanAccountsObservable = observable;
  };

  const makeDiscoveredEvent = (account: Account): ScanAccountEvent => ({
    type: "discovered",
    account,
  });

  const getCurrentCurrency = () => routeParams.currency;

  const resetSpies = () => {
    replace.mockClear();
    navigate.mockClear();
    goBack.mockClear();
    pop.mockClear();
  };

  return {
    replace,
    navigate,
    goBack,
    pop,
    setRouteParams,
    setScanObservable,
    makeDiscoveredEvent,
    resetSpies,
    getCurrentCurrency,
  };
};
