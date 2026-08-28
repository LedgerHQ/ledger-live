import React from "react";
import { render, screen } from "@testing-library/react";
import { getI18n } from "react-i18next";
import { useTranslation } from "../useTranslation";
import { I18nTestProvider, createI18nTestInstance } from "../testing";

function Greeting() {
  const { t } = useTranslation();
  return <span>{t("some.key")}</span>;
}

describe("createI18nTestInstance", () => {
  it("initialises synchronously", () => {
    expect(createI18nTestInstance().isInitialized).toBe(true);
  });

  it("echoes the key back when no resource matches", () => {
    expect(createI18nTestInstance().t("some.key")).toBe("some.key");
  });

  it("does not register itself as react-i18next's process-global instance", () => {
    // `initReactI18next` would call `setI18n`, making a throwaway instance the default that every
    // bare `useTranslation()` in the jest process resolves against. The provider passes the
    // instance explicitly, so nothing here needs that.
    const before = getI18n();
    createI18nTestInstance({ resources: { en: { translation: { "some.key": "hijacked" } } } });
    expect(getI18n()).toBe(before);
  });
});

describe("I18nTestProvider", () => {
  it("renders keys with no resources", () => {
    render(
      <I18nTestProvider>
        <Greeting />
      </I18nTestProvider>,
    );
    expect(screen.getByText("some.key")).toBeInTheDocument();
  });

  it("renders the resources it is given", () => {
    render(
      <I18nTestProvider resources={{ en: { translation: { "some.key": "Some value" } } }}>
        <Greeting />
      </I18nTestProvider>,
    );
    expect(screen.getByText("Some value")).toBeInTheDocument();
  });
});
