import { act, renderHook } from "@testing-library/react";
import type { ConfigOptionId } from "@shared/app-config";
import type { ConfigSwitchState } from "../../types";
import { useAppConfigViewModel } from "./useAppConfigViewModel";

const prodValues = { apiBaseUrl: "https://api.example.com" };
const stagingValues = { apiBaseUrl: "https://api.stg.example.com" };

function makeSwitch(overrides: Partial<ConfigSwitchState> = {}): ConfigSwitchState {
  return {
    id: "backend",
    label: "Backend",
    options: [
      { id: "prod", values: prodValues },
      { id: "staging", values: stagingValues },
    ],
    currentOptionId: "prod",
    savedOptionId: undefined,
    ...overrides,
  };
}

const ids = (rows: readonly { id: string }[]) => rows.map(({ id }) => id);

function renderViewModel(
  switches: readonly ConfigSwitchState[],
  defaultOptionId: ConfigOptionId = "prod",
) {
  const onSelectOption = jest.fn();
  const onResetSwitch = jest.fn();
  const onReloadApp = jest.fn();
  const view = renderHook(() =>
    useAppConfigViewModel({
      defaultOptionId,
      switches,
      onSelectOption,
      onResetSwitch,
      onReloadApp,
    }),
  );
  return { ...view, onSelectOption, onResetSwitch, onReloadApp };
}

describe("useAppConfigViewModel", () => {
  it("should select the default option when no option is saved", () => {
    const { result } = renderViewModel([makeSwitch()]);

    expect(result.current.defaultOptionId).toBe("prod");
    expect(result.current.rows[0]).toMatchObject({
      selectedOptionId: "prod",
      selectedValues: prodValues,
      isPending: false,
    });
    expect(result.current.pendingCount).toBe(0);
  });

  it("should list no switch until the default is known", () => {
    const { result } = renderHook(() =>
      useAppConfigViewModel({
        defaultOptionId: undefined,
        switches: [makeSwitch()],
        onSelectOption: jest.fn(),
        onResetSwitch: jest.fn(),
        onReloadApp: jest.fn(),
      }),
    );

    expect(result.current.rows).toEqual([]);
  });

  it("should select the saved option, pending until a reload", () => {
    const { result } = renderViewModel([makeSwitch({ savedOptionId: "staging" })]);

    expect(result.current.rows[0]).toMatchObject({
      selectedOptionId: "staging",
      selectedValues: stagingValues,
      isPending: true,
    });
    expect(result.current.pendingCount).toBe(1);
  });

  it("should not be pending when the saved option is the current one", () => {
    const { result } = renderViewModel([
      makeSwitch({ currentOptionId: "staging", savedOptionId: "staging" }),
    ]);

    expect(result.current.rows[0].isPending).toBe(false);
  });

  it("should be pending when the default is not the option the session runs on", () => {
    const { result } = renderViewModel([makeSwitch({ currentOptionId: "staging" })]);

    expect(result.current.rows[0]).toMatchObject({ selectedOptionId: "prod", isPending: true });
  });

  it("should save an option other than the default through onSelectOption", () => {
    const { result, onSelectOption, onResetSwitch } = renderViewModel([makeSwitch()]);

    act(() => result.current.select("backend", "staging"));

    expect(onSelectOption).toHaveBeenCalledWith("backend", "staging");
    expect(onResetSwitch).not.toHaveBeenCalled();
  });

  it("should reset the switch through onResetSwitch when the default is selected", () => {
    const { result, onSelectOption, onResetSwitch } = renderViewModel([
      makeSwitch({ savedOptionId: "staging" }),
    ]);

    act(() => result.current.select("backend", "prod"));

    expect(onResetSwitch).toHaveBeenCalledWith("backend");
    expect(onSelectOption).not.toHaveBeenCalled();
  });

  it("should reload through onReloadApp", () => {
    const { result, onReloadApp } = renderViewModel([makeSwitch({ savedOptionId: "staging" })]);

    act(() => result.current.reload());

    expect(onReloadApp).toHaveBeenCalledTimes(1);
  });

  describe("search and filter", () => {
    const switches = [
      makeSwitch(),
      makeSwitch({ id: "explorers", label: "Block explorers", savedOptionId: "staging" }),
      makeSwitch({ id: "swap", label: "Swap", currentOptionId: "staging" }),
    ];

    it("should match the label, the id or a value name, ignoring case", () => {
      const { result } = renderViewModel(switches);

      act(() => result.current.setSearch("BLOCK"));
      expect(ids(result.current.rows)).toEqual(["explorers"]);

      act(() => result.current.setSearch("swap"));
      expect(ids(result.current.rows)).toEqual(["swap"]);

      act(() => result.current.setSearch("apibase"));
      expect(ids(result.current.rows)).toEqual(["backend", "explorers", "swap"]);
    });

    it("should only list the switches off the default, now or in the next session, when switched", () => {
      const { result } = renderViewModel(switches);

      act(() => result.current.setFilter("switched"));

      expect(ids(result.current.rows)).toEqual(["explorers", "swap"]);
      expect(result.current.switchCount).toBe(3);
    });

    it("should still count the pending changes of the switches it hides", () => {
      const { result } = renderViewModel(switches);

      act(() => result.current.setSearch("backend"));

      expect(ids(result.current.rows)).toEqual(["backend"]);
      expect(result.current.pendingCount).toBe(2);
    });
  });
});
