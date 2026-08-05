import { buildFeeSelectorOptions, feeStrategySublabel } from "../feeSelectorOptions";
import type { FeeStrategyOption } from "../feeSelectorOptions";

const preset = (id: string, over: Partial<FeeStrategyOption> = {}): FeeStrategyOption => ({
  id,
  kind: "preset",
  sublabelFiat: `${id}-fiat`,
  sublabelCrypto: `${id}-crypto`,
  sublabelLegend: `${id}-legend`,
  ...over,
});

describe("feeStrategySublabel", () => {
  it("joins the fiat and native amounts", () => {
    expect(feeStrategySublabel(preset("slow"), { preferLegend: false })).toBe(
      "slow-fiat · slow-crypto",
    );
  });

  it("prefers the fee-rate legend for coins that price fees by rate", () => {
    expect(feeStrategySublabel(preset("slow"), { preferLegend: true })).toBe("slow-legend");
  });

  it("falls back to the amounts when a legend coin has no legend for the preset", () => {
    expect(
      feeStrategySublabel(preset("slow", { sublabelLegend: null }), {
        preferLegend: true,
      }),
    ).toBe("slow-fiat · slow-crypto");
  });

  it("degrades to whichever amount is available", () => {
    expect(
      feeStrategySublabel(preset("slow", { sublabelCrypto: null }), {
        preferLegend: false,
      }),
    ).toBe("slow-fiat");
    expect(
      feeStrategySublabel(preset("slow", { sublabelFiat: null }), {
        preferLegend: false,
      }),
    ).toBe("slow-crypto");
    expect(
      feeStrategySublabel(preset("slow", { sublabelFiat: null, sublabelCrypto: null }), {
        preferLegend: false,
      }),
    ).toBeNull();
  });
});

describe("buildFeeSelectorOptions", () => {
  it("maps strategy options through labelFor/sublabelFor and flags the selected one", () => {
    const onSelectFeeStrategyId = jest.fn();
    const options = buildFeeSelectorOptions({
      strategyOptions: [preset("slow"), preset("medium")],
      selectedFeeStrategyId: "medium",
      onSelectFeeStrategyId,
      labelFor: o => `label:${o.id}`,
      sublabelFor: o => o.sublabelFiat,
    });

    expect(options).toHaveLength(2);
    expect(options[0]).toMatchObject({
      id: "slow",
      kind: "preset",
      label: "label:slow",
      selected: false,
    });
    expect(options[1]).toMatchObject({
      id: "medium",
      label: "label:medium",
      selected: true,
    });

    options[0].onSelect();
    expect(onSelectFeeStrategyId).toHaveBeenCalledWith("slow");
  });

  it("appends the custom entry and marks it selected when the current strategy is custom", () => {
    const onCustom = jest.fn();
    const options = buildFeeSelectorOptions({
      strategyOptions: [],
      selectedFeeStrategyId: "custom",
      onSelectFeeStrategyId: jest.fn(),
      labelFor: o => o.id,
      sublabelFor: () => null,
      custom: { enabled: true, label: "Custom", onSelect: onCustom },
    });

    expect(options).toEqual([
      {
        id: "custom",
        kind: "custom",
        label: "Custom",
        sublabel: null,
        selected: true,
        onSelect: onCustom,
      },
    ]);
  });

  it("appends the coin-control entry (never selected) after the presets", () => {
    const onCoinControl = jest.fn();
    const options = buildFeeSelectorOptions({
      strategyOptions: [preset("fast")],
      selectedFeeStrategyId: "coinControl",
      onSelectFeeStrategyId: jest.fn(),
      labelFor: o => o.id,
      sublabelFor: () => null,
      coinControl: {
        enabled: true,
        label: "Coin control",
        onSelect: onCoinControl,
      },
    });

    expect(options.map(o => o.id)).toEqual(["fast", "coinControl"]);
    const coinControl = options[1];
    expect(coinControl).toMatchObject({ kind: "coinControl", selected: false });
    coinControl.onSelect();
    expect(onCoinControl).toHaveBeenCalledTimes(1);
  });

  it("omits custom/coin-control entries when not provided", () => {
    const options = buildFeeSelectorOptions({
      strategyOptions: [preset("medium")],
      selectedFeeStrategyId: "medium",
      onSelectFeeStrategyId: jest.fn(),
      labelFor: o => o.id,
      sublabelFor: () => null,
    });

    expect(options.map(o => o.kind)).toEqual(["preset"]);
  });

  it("omits an extra entry that is disabled or missing its handler", () => {
    const options = buildFeeSelectorOptions({
      strategyOptions: [preset("medium")],
      selectedFeeStrategyId: "medium",
      onSelectFeeStrategyId: jest.fn(),
      labelFor: o => o.id,
      sublabelFor: () => null,
      custom: { enabled: false, label: "Custom", onSelect: jest.fn() },
      coinControl: {
        enabled: true,
        label: "Coin control",
        onSelect: undefined,
      },
    });

    expect(options.map(o => o.kind)).toEqual(["preset"]);
  });
});
