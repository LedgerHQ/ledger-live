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
      isOnDev: false,
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

  it("should offer Dev first when the default is staging", () => {
    const { result } = renderViewModel({ defaultOptionId: "staging" });

    expect(result.current.switchRows[0].choices).toEqual(["dev", "staging", "prod"]);
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

  it("should be pending on Dev when only the dev values change", () => {
    const { result } = renderViewModel({
      defaultOptionId: "staging",
      switches: [
        makeSwitch({
          currentSelectionId: "dev",
          savedSelectionId: "dev",
          values: [
            makeValue({
              currentValue: "http://localhost:3000",
              nextValue: "http://localhost:4000",
            }),
          ],
        }),
      ],
    });

    expect(result.current.switchRows[0]).toMatchObject({ isOnDev: true, isPending: true });
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

  it("should commit the registered drafts before reloading, but not the dropped ones", () => {
    const { result, onReloadApp } = renderViewModel();
    const commit = jest.fn(() => true);
    const droppedCommit = jest.fn(() => true);

    act(() => {
      result.current.registerDraft(commit);
      const drop = result.current.registerDraft(droppedCommit);
      drop();
    });
    act(() => result.current.reload());

    expect(commit).toHaveBeenCalledTimes(1);
    expect(droppedCommit).not.toHaveBeenCalled();
    expect(commit.mock.invocationCallOrder[0]).toBeLessThan(
      onReloadApp.mock.invocationCallOrder[0],
    );
  });

  it("should commit every draft but not reload when the host refuses one", () => {
    const { result, onReloadApp } = renderViewModel();
    const refusedCommit = jest.fn(() => false);
    const savedCommit = jest.fn(() => true);

    act(() => {
      result.current.registerDraft(refusedCommit);
      result.current.registerDraft(savedCommit);
    });
    act(() => result.current.reload());

    expect(refusedCommit).toHaveBeenCalledTimes(1);
    expect(savedCommit).toHaveBeenCalledTimes(1);
    expect(onReloadApp).not.toHaveBeenCalled();
  });

  it("should commit the drafts before saving a selection", () => {
    const { result, onSelect } = renderViewModel();
    const commit = jest.fn(() => true);

    act(() => {
      result.current.registerDraft(commit);
    });
    act(() => result.current.selectOption("backend", "staging"));

    expect(commit.mock.invocationCallOrder[0]).toBeLessThan(onSelect.mock.invocationCallOrder[0]);
  });

  describe("fixed values", () => {
    it("should offer Dev | Fixed only when the default is staging", () => {
      expect(
        renderViewModel({ fixedValues: [makeFixed()] }).result.current.fixedRows[0].choices,
      ).toEqual([]);
      expect(
        renderViewModel({ defaultOptionId: "staging", fixedValues: [makeFixed()] }).result.current
          .fixedRows[0],
      ).toMatchObject({ choices: ["dev", "fixed"], selectedChoice: "fixed", isOnDev: false });
    });

    it("should be on Dev and pending once Dev is saved", () => {
      const { result } = renderViewModel({
        defaultOptionId: "staging",
        switches: [],
        fixedValues: [makeFixed({ isDevSaved: true })],
      });

      expect(result.current.fixedRows[0]).toMatchObject({
        currentChoice: "fixed",
        selectedChoice: "dev",
        isOnDev: true,
        isPending: true,
        isSwitched: true,
      });
      expect(result.current.pendingCount).toBe(1);
    });

    it("should put a fixed value on Dev through onSelect, and back through onResetSelection", () => {
      const { result, onSelect, onResetSelection } = renderViewModel({
        defaultOptionId: "staging",
        fixedValues: [makeFixed()],
      });

      act(() => result.current.selectFixed("clientVersion", "dev"));
      act(() => result.current.selectFixed("clientVersion", "fixed"));

      expect(onSelect).toHaveBeenCalledWith("clientVersion", "dev");
      expect(onResetSelection).toHaveBeenCalledWith("clientVersion");
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
    onSetDevValue: jest.fn(() => true),
    onRemoveDevValue: jest.fn(),
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
      baseValue: "test/1.0.0",
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
    baseValue: prodUrl,
    hasDevValue: false,
    rejectedDevValue: undefined,
    ...overrides,
  };
}

function ids(rows: readonly { id: string }[]) {
  return rows.map(({ id }) => id);
}
