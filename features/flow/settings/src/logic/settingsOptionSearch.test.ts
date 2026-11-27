import { matchesSettingsOption } from "./settingsOptionSearch";

describe("matchesSettingsOption", () => {
  const bitcoin = { value: "BTC", label: "Bitcoin", description: "BTC" };

  it("matches the label, whatever the case", () => {
    expect(matchesSettingsOption(bitcoin, "bitc")).toBe(true);
  });

  it("matches the description, e.g. a ticker", () => {
    expect(matchesSettingsOption({ ...bitcoin, value: "bitcoin" }, "btc")).toBe(true);
  });

  it("matches the value", () => {
    expect(matchesSettingsOption({ value: "fr-FR", label: "France (French)" }, "fr-fr")).toBe(true);
  });

  it("matches every option on an empty search", () => {
    expect(matchesSettingsOption(bitcoin, "  ")).toBe(true);
  });

  it("does not match another text", () => {
    expect(matchesSettingsOption(bitcoin, "euro")).toBe(false);
  });
});
