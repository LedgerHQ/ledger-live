/** @jest-environment jsdom */
import { renderHook } from "@testing-library/react";
import { combineReducers, legacy_createStore as createStore } from "redux";
import settings from "~/renderer/reducers/settings";
import React from "react";
import { useSelector } from "LLD/hooks/redux";
import { Provider } from "react-redux";
import { useLocalizedUrl } from ".";
import { urls } from "../../../config/urls";
const store = createStore(
  combineReducers({
    settings,
  }),
);

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const mockedUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

jest.mock("LLD/hooks/redux", () => {
  return {
    useSelector: jest.fn(),
  };
});

describe("useLocalizedUrl", () => {
  // Needed to wrap hook in a Redux Store
  const HookWrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      {/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- react-redux uses @types/react@18, desktop uses @19; ReactNode differs */}
      {children as React.ComponentProps<typeof Provider>["children"]}
    </Provider>
  );

  let localizedUrl: ReturnType<typeof useLocalizedUrl>;

  const setLocaleMockWithURL = (locale: string, url: string) => {
    mockedUseSelector.mockReturnValue(locale);
    const { result } = renderHook(() => useLocalizedUrl(url), {
      wrapper: HookWrapper,
    });
    localizedUrl = result.current;
  };

  test("LEDGER", () => {
    setLocaleMockWithURL("fr", urls.ledgerValidator);
    expect(localizedUrl).toEqual("https://www.ledger.com/fr/staking");

    setLocaleMockWithURL("fr", urls.ledger);
    expect(localizedUrl).toEqual("https://www.ledger.com/fr");

    setLocaleMockWithURL("ja", urls.ledgerValidator);
    expect(localizedUrl).toEqual("https://www.ledger.com/ja/staking");

    setLocaleMockWithURL("pt", urls.ledgerValidator);
    expect(localizedUrl).toEqual("https://www.ledger.com/pt-br/staking");

    setLocaleMockWithURL("zh", urls.ledgerValidator);
    expect(localizedUrl).toEqual("https://www.ledger.com/zh-hans/staking");

    setLocaleMockWithURL("th", urls.ledgerValidator);
    expect(localizedUrl).toEqual("https://www.ledger.com/th/staking");

    setLocaleMockWithURL("en", urls.ledgerValidator);
    expect(localizedUrl).toEqual("https://www.ledger.com/staking");
  });

  test("LEDGER_BASE", () => {
    setLocaleMockWithURL("fr", urls.faq);
    expect(localizedUrl).toEqual("https://support.ledger.com/fr");

    setLocaleMockWithURL("pt", urls.faq);
    expect(localizedUrl).toEqual("https://support.ledger.com/pt-br");

    setLocaleMockWithURL("zh", urls.faq);
    expect(localizedUrl).toEqual("https://support.ledger.com/zh-cn");
  });

  test("LEDGER_SUPPORT_SALESFORCE", () => {
    setLocaleMockWithURL("fr", urls.troubleshootingUSB);
    expect(localizedUrl).toEqual("https://support.ledger.com/fr/article/115005165269-zd");

    setLocaleMockWithURL("en", urls.troubleshootingUSB);
    expect(localizedUrl).toEqual("https://support.ledger.com/article/115005165269-zd");

    setLocaleMockWithURL("zh", urls.troubleshootingUSB);
    expect(localizedUrl).toEqual("https://support.ledger.com/zh-cn/article/115005165269-zd");

    setLocaleMockWithURL("th", urls.troubleshootingUSB);
    expect(localizedUrl).toEqual("https://support.ledger.com/th/article/115005165269-zd");
  });

  test("SHOP", () => {
    setLocaleMockWithURL("fr", urls.banners.blackfriday);
    expect(localizedUrl).toEqual(
      "https://shop.ledger.com/fr/pages/black-friday?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=banner_carousel",
    );

    setLocaleMockWithURL("es", urls.banners.blackfriday);
    expect(localizedUrl).toEqual(
      "https://shop.ledger.com/es/pages/black-friday?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=banner_carousel",
    );

    setLocaleMockWithURL("pt", urls.banners.blackfriday);
    expect(localizedUrl).toEqual(
      "https://shop.ledger.com/pt-br/pages/black-friday?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=banner_carousel",
    );

    setLocaleMockWithURL("th", urls.banners.blackfriday);
    expect(localizedUrl).toEqual(
      "https://shop.ledger.com/th/pages/black-friday?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=banner_carousel",
    );

    setLocaleMockWithURL("en", urls.banners.blackfriday);
    expect(localizedUrl).toEqual(
      "https://shop.ledger.com/pages/black-friday?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=banner_carousel",
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
