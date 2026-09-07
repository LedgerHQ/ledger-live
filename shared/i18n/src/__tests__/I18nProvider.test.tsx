import React from "react";
import { render, screen } from "@testing-library/react";
import { I18nextProvider, useTranslation as useReactI18nextTranslation } from "react-i18next";
import { I18nProvider } from "../I18nProvider";
import { MissingI18nProviderError } from "../errors";
import { Trans } from "../Trans";
import { useI18n } from "../context";
import { useTranslation } from "../useTranslation";
import { createI18nTestInstance } from "../testing";

const resources = {
  en: {
    translation: {
      greeting: "Hello",
      interpolated: "Hello {{name}}",
      rich: "Read the <1>docs</1>",
    },
    other: { greeting: "Hello from other" },
  },
  fr: { translation: { greeting: "Bonjour" } },
};

function Greeting() {
  const { t } = useTranslation();
  return <span>{t("greeting")}</span>;
}

function renderWithI18n(ui: React.ReactNode, i18n = createI18nTestInstance({ resources })) {
  return { i18n, ...render(<I18nProvider i18n={i18n}>{ui}</I18nProvider>) };
}

describe("I18nProvider", () => {
  it("resolves keys through the injected instance", () => {
    renderWithI18n(<Greeting />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("exposes the injected instance to useI18n", () => {
    function Language() {
      return <span>{useI18n().language}</span>;
    }
    renderWithI18n(<Language />, createI18nTestInstance({ resources, language: "fr" }));
    expect(screen.getByText("fr")).toBeInTheDocument();
  });

  it("resolves against the injected instance, not the i18next global singleton", () => {
    const scoped = createI18nTestInstance({
      resources: { en: { translation: { greeting: "Scoped hello" } } },
    });
    renderWithI18n(<Greeting />, scoped);
    expect(screen.getByText("Scoped hello")).toBeInTheDocument();
  });

  it("ignores a foreign react-i18next provider wrapped around it", () => {
    // A UI library mounting its own <I18nextProvider> (Lumen does, for its a11y strings) must not
    // retarget the DDD packages: this provider passes its instance explicitly on every call.
    const foreign = createI18nTestInstance({
      resources: { en: { common: { greeting: "Foreign" } } },
      defaultNS: "common",
    });

    render(
      <I18nextProvider i18n={foreign}>
        <I18nProvider i18n={createI18nTestInstance({ resources })}>
          <Greeting />
        </I18nProvider>
      </I18nextProvider>,
    );

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.queryByText("Foreign")).toBeNull();
  });

  it("leaves a foreign react-i18next provider nested inside it untouched", () => {
    function ForeignGreeting() {
      const { t } = useReactI18nextTranslation();
      return <span>{t("greeting")}</span>;
    }
    const foreign = createI18nTestInstance({
      resources: { en: { common: { greeting: "Foreign" } } },
      defaultNS: "common",
    });

    render(
      <I18nProvider i18n={createI18nTestInstance({ resources })}>
        <Greeting />
        <I18nextProvider i18n={foreign}>
          <ForeignGreeting />
        </I18nextProvider>
      </I18nProvider>,
    );

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Foreign")).toBeInTheDocument();
  });

  it("keeps two providers isolated from each other", () => {
    const first = createI18nTestInstance({ resources: { en: { translation: { greeting: "A" } } } });
    const second = createI18nTestInstance({
      resources: { en: { translation: { greeting: "B" } } },
    });

    render(
      <>
        <I18nProvider i18n={first}>
          <Greeting />
        </I18nProvider>
        <I18nProvider i18n={second}>
          <Greeting />
        </I18nProvider>
      </>,
    );

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});

describe("useTranslation", () => {
  it("interpolates values", () => {
    function Interpolated() {
      const { t } = useTranslation();
      return <span>{t("interpolated", { name: "Satoshi" })}</span>;
    }
    renderWithI18n(<Interpolated />);
    expect(screen.getByText("Hello Satoshi")).toBeInTheDocument();
  });

  it("honours an explicit namespace", () => {
    function Other() {
      const { t } = useTranslation("other");
      return <span>{t("greeting")}</span>;
    }
    renderWithI18n(<Other />, createI18nTestInstance({ resources, defaultNS: "translation" }));
    expect(screen.getByText("Hello from other")).toBeInTheDocument();
  });

  it("returns the injected instance as the second tuple member", () => {
    function Tuple() {
      const [, i18n] = useTranslation();
      return <span>{i18n.language}</span>;
    }
    renderWithI18n(<Tuple />);
    expect(screen.getByText("en")).toBeInTheDocument();
  });

  it("throws a MissingI18nProviderError with no provider mounted", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Greeting />)).toThrow(MissingI18nProviderError);
    consoleError.mockRestore();
  });
});

describe("Trans", () => {
  it("renders interpolated React nodes through the injected instance", () => {
    function Rich() {
      return (
        <p>
          <Trans i18nKey="rich">
            Read the <a href="https://ledger.com">docs</a>
          </Trans>
        </p>
      );
    }
    renderWithI18n(<Rich />);
    expect(screen.getByRole("link", { name: "docs" })).toBeInTheDocument();
  });

  it("throws a MissingI18nProviderError with no provider mounted", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Trans i18nKey="rich" />)).toThrow(MissingI18nProviderError);
    consoleError.mockRestore();
  });
});
