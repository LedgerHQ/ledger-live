import { combineReducers, legacy_createStore as createStore } from "redux";
import React from "react";
import { Provider, useSelector } from "react-redux";
import { useLocalizedUrl } from ".";
import { renderHook } from "@testing-library/react-native";
import settings from "~/reducers/settings";
import { urls } from "~/utils/urls";

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const mockedUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

const store = createStore(
  combineReducers({
    settings,
  }),
);

describe("useLocalizedUrl", () => {
  // Needed to wrap hook in a Redux Store
  const HookWrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  let localizedUrl: ReturnType<typeof useLocalizedUrl>;

  const setLocaleMockWithURL = (locale: string, url: string) => {
    mockedUseSelector.mockReturnValue(locale);
    const { result } = renderHook(() => useLocalizedUrl(url), {
      wrapper: HookWrapper,
    });
    localizedUrl = result.current;
  };

  beforeEach(() => {
    mockedUseSelector.mockReset();
  });

  test("LEDGER", () => {
    setLocaleMockWithURL("fr", urls.resources.ledgerAcademy);
    expect(localizedUrl).toEqual(
      "https://www.ledger.com/fr/academy/?utm_source=ledger_live&utm_medium=self_referral&utm_content=help_mobile",
    );

    setLocaleMockWithURL("ja", urls.resources.ledgerAcademy);
    expect(localizedUrl).toEqual(
      "https://www.ledger.com/ja/academy/?utm_source=ledger_live&utm_medium=self_referral&utm_content=help_mobile",
    );

    setLocaleMockWithURL("pt", urls.resources.ledgerAcademy);
    expect(localizedUrl).toEqual(
      "https://www.ledger.com/pt-br/academy/?utm_source=ledger_live&utm_medium=self_referral&utm_content=help_mobile",
    );

    setLocaleMockWithURL("zh", urls.resources.ledgerAcademy);
    expect(localizedUrl).toEqual(
      "https://www.ledger.com/zh-hans/academy/?utm_source=ledger_live&utm_medium=self_referral&utm_content=help_mobile",
    );

    setLocaleMockWithURL("en", urls.resources.ledgerAcademy);
    expect(localizedUrl).toEqual(
      "https://www.ledger.com/academy/?utm_source=ledger_live&utm_medium=self_referral&utm_content=help_mobile",
    );

    setLocaleMockWithURL("th", urls.resources.ledgerAcademy);
    expect(localizedUrl).toEqual(
      "https://www.ledger.com/th/academy/?utm_source=ledger_live&utm_medium=self_referral&utm_content=help_mobile",
    );
  });

  test("LEDGER_SUPPORT_SALESFORCE", () => {
    setLocaleMockWithURL("fr", urls.pairingIssues);
    expect(localizedUrl).toEqual("https://support.ledger.com/fr/article/360025864773-zd");

    setLocaleMockWithURL("en", urls.pairingIssues);
    expect(localizedUrl).toEqual("https://support.ledger.com/article/360025864773-zd");

    setLocaleMockWithURL("zh", urls.pairingIssues);
    expect(localizedUrl).toEqual("https://support.ledger.com/zh-cn/article/360025864773-zd");

    setLocaleMockWithURL("th", urls.pairingIssues);
    expect(localizedUrl).toEqual("https://support.ledger.com/th/article/360025864773-zd");

    setLocaleMockWithURL("en", urls.pairingIssues);
    expect(localizedUrl).toEqual("https://support.ledger.com/article/360025864773-zd");
  });

  test("SHOP", () => {
    setLocaleMockWithURL("fr", urls.banners.blackfriday);
    expect(localizedUrl).toEqual(
      "https://shop.ledger.com/fr/pages/black-friday?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=banner_carousel",
    );

    setLocaleMockWithURL("es", urls.banners.blackfriday);
    expect(localizedUrl).toEqual(
      "https://shop.ledger.com/es/pages/black-friday?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=banner_carousel",
    );

    setLocaleMockWithURL("pt", urls.banners.blackfriday);
    expect(localizedUrl).toEqual(
      "https://shop.ledger.com/pt-br/pages/black-friday?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=banner_carousel",
    );

    setLocaleMockWithURL("th", urls.banners.blackfriday);
    expect(localizedUrl).toEqual(
      "https://shop.ledger.com/th/pages/black-friday?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=banner_carousel",
    );

    setLocaleMockWithURL("en", urls.banners.blackfriday);
    expect(localizedUrl).toEqual(
      "https://shop.ledger.com/pages/black-friday?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=banner_carousel",
    );
  });

  test("other url", () => {
    setLocaleMockWithURL("fr", urls.ledgerStatus);
    expect(localizedUrl).toEqual(urls.ledgerStatus);

    setLocaleMockWithURL("es", urls.ledgerStatus);
    expect(localizedUrl).toEqual(urls.ledgerStatus);

    setLocaleMockWithURL("pt", urls.ledgerStatus);
    expect(localizedUrl).toEqual(urls.ledgerStatus);
  });
});
