import { createInstance } from "i18next";
import { installContentAbTestCopyOverrides, setContentAbTestCopy } from "./store";

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
  installContentAbTestCopyOverrides(instance, englishBaseline, namespace);
  return { instance };
}

describe("content A/B test copy overrides", () => {
  beforeEach(() => {
    setContentAbTestCopy({});
  });

  afterEach(() => {
    setContentAbTestCopy({});
  });

  it("overrides t only in English and restores the English baseline", async () => {
    const { instance } = await createI18n();

    setContentAbTestCopy(
      remoteExperiment({
        enabled: true,
        copy: {
          greeting: "Remote hello",
          englishOnly: "Remote English fallback",
          unknown: "Remote unknown copy",
        },
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
  });

  it("keeps the baseline when the experiment is disabled", async () => {
    const { instance } = await createI18n();

    setContentAbTestCopy(remoteExperiment({ enabled: false, copy: { greeting: "Remote hello" } }));

    expect(instance.t("greeting")).toBe("Hello");
  });
});
