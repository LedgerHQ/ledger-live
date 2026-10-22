import { act, renderHook } from "@testing-library/react";
import type { ConfigOptionId } from "@shared/app-config";
import type { ConfigFixedValueState, ConfigSwitchState, ConfigValueState } from "../../types";
import { useAppConfigViewModel } from "./useAppConfigViewModel";

const prodUrl = "https://api.example.com";
const stagingUrl = "https://api.stg.example.com";

describe("useAppConfigViewModel", () => {
  it("should select the default option when no option is saved", () => {
    const { result } = renderViewModel();

    expect(result.current.defaultOptionId).toBe("prod");
    expect(result.current.switchRows[0]).toMatchObject({
      choices: ["staging", "prod"],
      selectedChoice: "prod",
      isPending: false,
    });
    expect(result.current.pendingCount).toBe(0);
  });

  it("should list nothing until the host has the session", () => {
    const { result } = renderViewModel({ defaultOptionId: undefined, fixedValues: [makeFixed()] });

    expect(result.current.defaultOptionId).toBeUndefined();
    expect(result.current.switchRows).toEqual([]);
    expect(result.current.fixedRows).toEqual([]);
  });

  it("should select the saved option, pending until a reload", () => {
    const { result } = renderViewModel({
      switches: [
        makeSwitch({ savedSelectionId: "staging", values: [makeValue({ nextValue: stagingUrl })] }),
      ],
    });

    expect(result.current.switchRows[0]).toMatchObject({
      selectedChoice: "staging",
      isPending: true,
    });
    expect(result.current.pendingCount).toBe(1);
  });

  it("should not be pending when the saved option is the current one", () => {
    const { result } = renderViewModel({
      switches: [makeSwitch({ currentSelectionId: "staging", savedSelectionId: "staging" })],
    });

    expect(result.current.switchRows[0].isPending).toBe(false);
  });

  it("should be pending when the default is not the option the session runs on", () => {
    const { result } = renderViewModel({
      switches: [makeSwitch({ currentSelectionId: "staging" })],
    });

    expect(result.current.switchRows[0]).toMatchObject({
      selectedChoice: "prod",
      isPending: true,
    });
  });

  it("should save an option other than the default through onSelect", () => {
    const { result, onSelect, onResetSelection } = renderViewModel();

    act(() => result.current.selectOption("backend", "staging"));

    expect(onSelect).toHaveBeenCalledWith("backend", "staging");
    expect(onResetSelection).not.toHaveBeenCalled();
  });

  it("should reset the switch through onResetSelection when the default is selected", () => {
    const { result, onSelect, onResetSelection } = renderViewModel({
      switches: [makeSwitch({ savedSelectionId: "staging" })],
    });

    act(() => result.current.selectOption("backend", "prod"));

    expect(onResetSelection).toHaveBeenCalledWith("backend");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("should reload through onReloadApp", () => {
    const { result, onReloadApp } = renderViewModel();

    act(() => result.current.reload());

    expect(onReloadApp).toHaveBeenCalledTimes(1);
  });

  describe("fixed values", () => {
    it("should list a fixed value without choices, pending once Dev is saved", () => {
      const { result } = renderViewModel({
        defaultOptionId: "staging",
        switches: [],
        fixedValues: [makeFixed({ isDevSaved: true })],
      });

      expect(result.current.fixedRows[0]).toMatchObject({
        choices: [],
        currentChoice: "fixed",
        selectedChoice: "dev",
        isPending: true,
        isSwitched: true,
      });
      expect(result.current.pendingCount).toBe(1);
    });
  });

  describe("search and filter", () => {
    const switches = [
      makeSwitch(),
      makeSwitch({ id: "explorers", label: "Block explorers", savedSelectionId: "staging" }),
      makeSwitch({ id: "swap", label: "Swap", currentSelectionId: "staging" }),
    ];
    const fixedValues = [makeFixed(), makeFixed({ name: "realm", isDevSaved: true })];

    it("should match the label, the id or a value name, ignoring case", () => {
      const { result } = renderViewModel({ switches, fixedValues });

      act(() => result.current.setSearch("BLOCK"));
      expect(ids(result.current.switchRows)).toEqual(["explorers"]);
      expect(result.current.fixedRows).toEqual([]);

      act(() => result.current.setSearch("swap"));
      expect(ids(result.current.switchRows)).toEqual(["swap"]);

      act(() => result.current.setSearch("apibase"));
      expect(ids(result.current.switchRows)).toEqual(["backend", "explorers", "swap"]);

      act(() => result.current.setSearch("realm"));
      expect(result.current.fixedRows.map(({ value }) => value.name)).toEqual(["realm"]);
    });

    it("should only list what is off the default, now or in the next session, when switched", () => {
      const { result } = renderViewModel({ switches, fixedValues });

      act(() => result.current.setFilter("switched"));

      expect(ids(result.current.switchRows)).toEqual(["explorers", "swap"]);
      expect(result.current.fixedRows.map(({ value }) => value.name)).toEqual(["realm"]);
      expect(result.current.rowCount).toBe(5);
    });

    it("should still count the pending changes of the rows it hides", () => {
      const { result } = renderViewModel({ switches, fixedValues });

      act(() => result.current.setSearch("backend"));

      expect(ids(result.current.switchRows)).toEqual(["backend"]);
      expect(result.current.pendingCount).toBe(3);
    });
  });
});

function renderViewModel(
  options: {
    switches?: readonly ConfigSwitchState[];
    fixedValues?: readonly ConfigFixedValueState[];
    defaultOptionId?: ConfigOptionId | undefined;
  } = {},
) {
  const { switches = [makeSwitch()], fixedValues = [] } = options;
  const defaultOptionId = "defaultOptionId" in options ? options.defaultOptionId : "prod";
  const callbacks = {
    onSelect: jest.fn(),
    onResetSelection: jest.fn(),
    onReloadApp: jest.fn(),
  };
  const view = renderHook(() =>
    useAppConfigViewModel({
      session:
        defaultOptionId === undefined ? undefined : { defaultOptionId, switches, fixedValues },
      ...callbacks,
    }),
  );
  return { ...view, ...callbacks };
}

function makeSwitch(overrides: Partial<ConfigSwitchState> = {}): ConfigSwitchState {
  return {
    id: "backend",
    label: "Backend",
    currentSelectionId: "prod",
    savedSelectionId: undefined,
    values: [makeValue()],
    ...overrides,
  };
}

function makeFixed(overrides: Partial<ConfigFixedValueState> = {}): ConfigFixedValueState {
  return {
    ...makeValue({
      name: "clientVersion",
      currentValue: "test/1.0.0",
      nextValue: "test/1.0.0",
    }),
    isDevCurrent: false,
    isDevSaved: false,
    ...overrides,
  };
}

function makeValue(overrides: Partial<ConfigValueState> = {}): ConfigValueState {
  return {
    name: "apiBaseUrl",
    currentValue: prodUrl,
    nextValue: prodUrl,
    ...overrides,
  };
}

function ids(rows: readonly { id: string }[]) {
  return rows.map(({ id }) => id);
}
