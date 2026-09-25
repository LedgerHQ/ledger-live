import React from "react";
import { createInstance } from "i18next";
import { I18nextProvider, Trans } from "react-i18next";
import { act, render, screen } from "tests/testSetup";
import { setContentAbTestCopy } from "~/firebase/contentAbTestCopy";
import { installContentAbTestCopyOverrides } from "./contentAbTestCopyOverrides";
import { useContentAbTestCopyUpdates } from "./useContentAbTestCopyUpdates";

const namespace = "app";
const englishBaseline = {
  greeting: "Hello",
  englishOnly: "English fallback",
};
const frenchBaseline = {
  greeting: "Bonjour",
};

const remoteExperiment = (payload: object) => ({
  feature_copy_greeting: {
    asString: () => JSON.stringify(payload),
    getSource: () => "remote",
  },
});

function CopyAwareRoot() {
  useContentAbTestCopyUpdates();
  return <CopyView />;
}

function CopyView() {
  return <Trans i18nKey="greeting" />;
}

async function createI18n(language = "en") {
  const instance = createInstance();
  await instance.init({
    lng: language,
    fallbackLng: "en",
    defaultNS: namespace,
    resources: {
      en: { [namespace]: englishBaseline },
      fr: { [namespace]: frenchBaseline },
    },
  });
  const uninstall = installContentAbTestCopyOverrides(instance, englishBaseline, namespace);
  return { instance, uninstall };
}

describe("content A/B test copy overrides", () => {
  beforeEach(() => {
    setContentAbTestCopy({});
  });

  afterEach(() => {
    setContentAbTestCopy({});
  });

  it("overrides t only in English and restores the app.json baseline", async () => {
    const { instance, uninstall } = await createI18n();

    setContentAbTestCopy(
      remoteExperiment({
        enabled: true,
        greeting: "Remote hello",
        englishOnly: "Remote English fallback",
        unknown: "Remote unknown copy",
      }),
    );
    expect(instance.t("greeting")).toBe("Remote hello");
    expect(instance.t("englishOnly")).toBe("Remote English fallback");
    expect(instance.t("unknown")).toBe("unknown");

    await instance.changeLanguage("fr");
    expect(instance.t("greeting")).toBe("Bonjour");
    expect(instance.t("englishOnly")).toBe("English fallback");

    await instance.changeLanguage("en");
    expect(instance.t("greeting")).toBe("Remote hello");

    setContentAbTestCopy({});
    expect(instance.t("greeting")).toBe("Hello");
    uninstall();
  });

  it("keeps the baseline when the experiment is disabled", async () => {
    const { instance, uninstall } = await createI18n();

    setContentAbTestCopy(remoteExperiment({ enabled: false, greeting: "Remote hello" }));

    expect(instance.t("greeting")).toBe("Hello");
    uninstall();
  });

  it("updates Trans when enabled copy changes", async () => {
    const { instance, uninstall } = await createI18n();
    render(
      <I18nextProvider i18n={instance}>
        <CopyAwareRoot />
      </I18nextProvider>,
    );

    expect(screen.getByText("Hello")).toBeVisible();

    act(() => {
      setContentAbTestCopy(remoteExperiment({ enabled: true, greeting: "Remote hello" }));
    });

    expect(screen.getByText("Remote hello")).toBeVisible();
    uninstall();
  });
});
