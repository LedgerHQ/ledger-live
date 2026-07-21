import React from "react";
import { render, screen } from "@testing-library/react";
import i18next from "i18next";
import { initReactI18next, useTranslation, Trans, I18nextProvider } from "react-i18next";
import realEn from "../../../static/i18n/en/app.json";
import { ICU, icuI18nFormat } from "./icu";

/**
 * LIVE-31440 — end-to-end coverage of the full ICU MessageFormat setup on desktop,
 * exercised through real `useTranslation` and `<Trans>` usage. Guarantees:
 *  - single-brace `{var}` interpolation works
 *  - ICU plural (one/other, few/many), `=0` and `select` work
 *  - a plural resolved without `count` falls back to the singular form
 *  - `<Trans>` resolves plurals, interpolation and embedded tags
 *  - the real migrated `en` catalog renders correctly
 */
const resources = {
  en: {
    translation: {
      greeting: "Hello {name}",
      itemCount: "{count, plural, one {# item} other {# items}}",
      inbox: "{count, plural, one {{name} has # message} other {{name} has # messages}}",
      addresses: "{count, plural, =0 {no address} one {# address} other {# addresses}}",
      pronoun: "{gender, select, male {He} female {She} other {They}} replied",
      reward: "You have <1>{count} rewards</1> to claim",
    },
  },
  ru: {
    translation: {
      itemCount:
        "{count, plural, one {# предмет} few {# предмета} many {# предметов} other {# предмета}}",
    },
  },
};

const i18n = i18next.createInstance();

beforeAll(async () => {
  await i18n
    .use(ICU)
    .use(initReactI18next)
    .init({
      lng: "en",
      fallbackLng: "en",
      i18nFormat: icuI18nFormat,
      resources,
      interpolation: { escapeValue: false },
    });
});

afterEach(() => i18n.changeLanguage("en"));

function Hook({ k, opts }: { k: string; opts?: Record<string, unknown> }) {
  const { t } = useTranslation();
  return <span>{t(k, opts)}</span>;
}

const renderWithI18n = (ui: React.ReactElement) =>
  render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);

describe("ICU integration (desktop) — useTranslation", () => {
  it("interpolates single-brace {var}", () => {
    renderWithI18n(<Hook k="greeting" opts={{ name: "Lucas" }} />);
    expect(screen.getByText("Hello Lucas")).toBeTruthy();
  });

  it("resolves ICU plural one/other", () => {
    renderWithI18n(<Hook k="itemCount" opts={{ count: 1 }} />);
    expect(screen.getByText("1 item")).toBeTruthy();
    renderWithI18n(<Hook k="itemCount" opts={{ count: 5 }} />);
    expect(screen.getByText("5 items")).toBeTruthy();
  });

  it("resolves a plural mixed with another variable", () => {
    renderWithI18n(<Hook k="inbox" opts={{ count: 3, name: "Anna" }} />);
    expect(screen.getByText("Anna has 3 messages")).toBeTruthy();
  });

  it("honours =0 before the other category", () => {
    renderWithI18n(<Hook k="addresses" opts={{ count: 0 }} />);
    expect(screen.getByText("no address")).toBeTruthy();
    renderWithI18n(<Hook k="addresses" opts={{ count: 2 }} />);
    expect(screen.getByText("2 addresses")).toBeTruthy();
  });

  it("resolves ICU select", () => {
    renderWithI18n(<Hook k="pronoun" opts={{ gender: "female" }} />);
    expect(screen.getByText("She replied")).toBeTruthy();
  });

  it("falls back to the singular form when count is missing", () => {
    renderWithI18n(<Hook k="itemCount" />);
    expect(screen.getByText("1 item")).toBeTruthy();
  });

  it("resolves ALL Russian plural categories", () => {
    i18n.changeLanguage("ru");
    renderWithI18n(<Hook k="itemCount" opts={{ count: 1 }} />);
    expect(screen.getByText("1 предмет")).toBeTruthy();
    renderWithI18n(<Hook k="itemCount" opts={{ count: 2 }} />);
    expect(screen.getByText("2 предмета")).toBeTruthy();
    renderWithI18n(<Hook k="itemCount" opts={{ count: 5 }} />);
    expect(screen.getByText("5 предметов")).toBeTruthy();
  });
});

describe("ICU integration (desktop) — <Trans>", () => {
  it("resolves a plural key through <Trans count>", () => {
    renderWithI18n(<Trans i18nKey="itemCount" count={2} />);
    expect(screen.getByText("2 items")).toBeTruthy();
  });

  it("interpolates and renders embedded tags", () => {
    renderWithI18n(
      <Trans
        i18nKey="reward"
        count={3}
        components={[<span key="0" />, <b data-testid="rw" key="1" />]}
      />,
    );
    expect(screen.getByTestId("rw")).toHaveTextContent("3 rewards");
  });
});

describe("ICU integration (desktop) — real migrated catalog", () => {
  const realI18n = i18next.createInstance();
  beforeAll(async () => {
    await realI18n.use(ICU).init({
      lng: "en",
      fallbackLng: "en",
      i18nFormat: icuI18nFormat,
      ns: ["app"],
      defaultNS: "app",
      resources: { en: { app: realEn } },
      interpolation: { escapeValue: false },
    });
  });

  it("renders a migrated plural key from the committed en file", () => {
    expect(realI18n.t("common.sync.failingSync", { count: 1 })).toBe("Account failing to sync:");
    expect(realI18n.t("common.sync.failingSync", { count: 5 })).toBe("Accounts failing to sync:");
  });

  it("carries the Smartling ICU directive in the en source", () => {
    expect((realEn as { smartling: { string_format: string } }).smartling.string_format).toBe(
      "icu",
    );
  });
});
