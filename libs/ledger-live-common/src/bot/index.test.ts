import { getSpecs } from ".";
import { setSupportedCurrencies } from "../currencies/index";

jest.mock("./allSpecs", () => {
  const { getCryptoCurrencyById: get } = jest.requireActual("@ledgerhq/cryptoassets");
  const bitcoin = get("bitcoin");
  const ethereum = get("ethereum");
  const digibyte = get("digibyte");
  return {
    __esModule: true,
    default: {
      bitcoin: {
        bitcoin: {
          currency: bitcoin,
          disabled: false,
          mutations: [
            { name: "Send", feature: "send" },
            { name: "Send Max", feature: "sendMax" },
          ],
        },
        digibyte: {
          currency: digibyte,
          disabled: false,
          mutations: [{ name: "Send DGB", feature: "send" }],
        },
      },
      evm: {
        ethereum: {
          currency: ethereum,
          disabled: false,
          mutations: [{ name: "Send ETH", feature: "send" }],
        },
      },
    },
  };
});

describe("getSpecs", () => {
  it("should filter currencies correctly", async () => {
    setSupportedCurrencies(["bitcoin", "ethereum"]);
    const specs = await getSpecs({ disabled: {}, filter: { currencies: ["bitcoin"] } });
    expect(specs[0].currency.id).toEqual("bitcoin");
  });

  it("should filter families correctly", async () => {
    setSupportedCurrencies(["bitcoin", "ethereum"]);
    const specs = await getSpecs({ disabled: {}, filter: { families: ["bitcoin"] } });
    expect(specs.length).toBeGreaterThan(0);
    expect(specs.every(spec => spec.currency.family === "bitcoin")).toEqual(true);
  });

  it("should filter by feature correctly", async () => {
    setSupportedCurrencies(["bitcoin"]);
    const specs = await getSpecs({ disabled: {}, filter: { features: ["send"] } });
    expect(specs[0].mutations.length).toBeGreaterThan(0);
    expect(specs[0].mutations.every(spec => spec.feature === "send")).toEqual(true);
  });

  it("should filter multiple features correctly", async () => {
    setSupportedCurrencies(["bitcoin"]);
    const currentFilter = ["send", "sendMax"];
    const specs = await getSpecs({ disabled: {}, filter: { features: currentFilter } });
    expect(specs[0].mutations.length).toBeGreaterThan(0);
    expect(specs[0].mutations.every(spec => currentFilter.includes(spec.feature))).toEqual(true);
  });

  it("should filter no features correctly", async () => {
    setSupportedCurrencies(["bitcoin"]);
    const currentFilter = [];
    const specs = await getSpecs({ disabled: {}, filter: { features: currentFilter } });
    expect(specs[0].mutations.length).toBeGreaterThan(0);
  });

  it("should filter features not set correctly", async () => {
    setSupportedCurrencies(["bitcoin"]);
    const specs = await getSpecs({ disabled: {}, filter: {} });
    expect(specs[0].mutations.length).toBeGreaterThan(0);
  });

  it("should disable currencies correctly", async () => {
    setSupportedCurrencies(["bitcoin", "ethereum", "digibyte"]);
    const specs = await getSpecs({ disabled: { currencies: ["digibyte"] }, filter: {} });
    expect(specs.find(spec => spec.currency.id === "digibyte")).toBeFalsy();
    expect(specs.find(spec => spec.currency.id === "ethereum")).toBeTruthy();
    expect(specs.find(spec => spec.currency.id === "bitcoin")).toBeTruthy();
  });

  it("should disable families correctly", async () => {
    setSupportedCurrencies(["bitcoin", "ethereum", "digibyte"]);
    const specs = await getSpecs({ disabled: { families: ["bitcoin"] }, filter: {} });
    expect(specs.find(spec => spec.currency.family === "bitcoin")).toBeFalsy();
    expect(specs.filter(spec => spec.currency.family === "evm").length).toEqual(1);
  });

  it("should return no specs with no currencies supported", async () => {
    setSupportedCurrencies([]);
    const specs = await getSpecs({ disabled: { families: ["bitcoin"] }, filter: {} });
    expect(specs.length).toEqual(0);
  });

  it("should return every supported specs with no filter or disabled currencies", async () => {
    setSupportedCurrencies(["bitcoin", "ethereum"]);
    const specs = await getSpecs({ disabled: {}, filter: {} });
    expect(specs.length).toEqual(2);
  });

  it("should prioritize filtered family over disabled ones", async () => {
    setSupportedCurrencies(["bitcoin"]);
    const specs = await getSpecs({
      disabled: { families: ["bitcoin"] },
      filter: { families: ["bitcoin"] },
    });
    expect(specs.length).toBeGreaterThan(0);
  });

  it("should prioritize filtered currencies over disabled ones", async () => {
    setSupportedCurrencies(["bitcoin"]);
    const specs = await getSpecs({
      disabled: { currencies: ["bitcoin"] },
      filter: { currencies: ["bitcoin"] },
    });
    expect(specs.length).toBeGreaterThan(0);
  });

  it("should not return unsupported currencies", async () => {
    setSupportedCurrencies([]);
    const specs = await getSpecs({
      disabled: {},
      filter: { currencies: ["bitcoin"] },
    });
    expect(specs.length).toEqual(0);
  });
});
