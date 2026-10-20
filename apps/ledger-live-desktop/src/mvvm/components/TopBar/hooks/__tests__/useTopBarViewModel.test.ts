import { Code, Devices, Eye, Experiment, Refresh } from "@ledgerhq/lumen-ui-react/symbols";
import { createElement } from "react";
import { MemoryRouter } from "react-router";
import { renderHook } from "tests/testSetup";
import useTopBarViewModel from "../useTopBarViewModel";
import { useActivityIndicator } from "../useActivityIndicator";
import { useDiscreetMode } from "../useDiscreetMode";
import { useExperimentalFeatures } from "../useExperimentalFeatures";
import { useDevTools } from "../useDevTools";
import { useMockServerTransport } from "../useMockServerTransport";
import type { TopBarSlot } from "../../types";

jest.mock("../useActivityIndicator");
jest.mock("../useDiscreetMode");
jest.mock("../useExperimentalFeatures");
jest.mock("../useDevTools");
jest.mock("../useMockServerTransport");

const defaults = {
  discreetMode: { handleDiscreet: jest.fn(), discreetIcon: Eye, tooltip: "Discreet" },
  activityIndicator: {
    hasAccounts: true,
    handleSync: jest.fn(),
    isRotating: false,
    isError: false,
    tooltip: "Refresh",
    icon: Refresh,
    onTooltipShow: undefined,
  },
  experimental: {
    isVisible: false,
    handleExperimental: jest.fn(),
    icon: Experiment,
    tooltip: "Experimental",
  },
  devTools: {
    isVisible: false,
    handleDevTools: jest.fn(),
    icon: Code,
    tooltip: "Dev tools",
  },
  mockServer: {
    isVisible: false,
    handleMockServer: jest.fn(),
    handleOpenConfigurationUi: jest.fn(),
    icon: Devices,
    tooltip: "Mock server connected",
    className: "bg-success-strong hover:bg-success-strong active:bg-success-strong",
  },
};

type SetupOptions = {
  hasAccounts?: boolean;
  isRotating?: boolean;
  experimentalVisible?: boolean;
  devToolsVisible?: boolean;
  mockServerVisible?: boolean;
  route?: string;
};

const setup = ({
  hasAccounts = true,
  isRotating = false,
  experimentalVisible = false,
  devToolsVisible = false,
  mockServerVisible = false,
  route,
}: SetupOptions = {}) => {
  jest.mocked(useDiscreetMode).mockReturnValue(defaults.discreetMode);
  jest.mocked(useActivityIndicator).mockReturnValue({
    ...defaults.activityIndicator,
    hasAccounts,
    isRotating,
  });
  jest.mocked(useExperimentalFeatures).mockReturnValue({
    ...defaults.experimental,
    isVisible: experimentalVisible,
  });
  jest.mocked(useDevTools).mockReturnValue({
    ...defaults.devTools,
    isVisible: devToolsVisible,
  });
  jest.mocked(useMockServerTransport).mockReturnValue({
    ...defaults.mockServer,
    isVisible: mockServerVisible,
  });

  const routeWrapper = route
    ? ({ children }: { children: React.ReactNode }) =>
        createElement(MemoryRouter, { initialEntries: [route] }, children)
    : undefined;

  return renderHook(() => useTopBarViewModel(), {
    ...(routeWrapper ? { wrapper: routeWrapper, skipRouter: true } : {}),
  });
};

const getSlotLabels = (slots: TopBarSlot[]) =>
  slots.map(s => (s.type === "action" ? s.action.label : s.type));

const findSlot = (slots: TopBarSlot[], label: string) =>
  slots.find((s): s is Extract<TopBarSlot, { type: "action" }> => {
    return s.type === "action" && s.action.label === label;
  });

describe("useTopBarViewModel", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("slot ordering", () => {
    it.each<[string, SetupOptions, string[]]>([
      ["default (with accounts)", {}, ["synchronize", "discreet", "history"]],
      ["without accounts", { hasAccounts: false }, ["discreet", "history"]],
      [
        "all optional slots visible",
        { experimentalVisible: true, devToolsVisible: true },
        ["experimental", "devtools", "synchronize", "discreet", "history"],
      ],
    ])("%s", (_name, options, expectedLabels) => {
      const { result } = setup(options);
      expect(getSlotLabels(result.current.topBarSlots)).toEqual(expectedLabels);
    });
  });

  describe("slot properties", () => {
    it("experimental and devtools slots have accent appearance", () => {
      const { result } = setup({ experimentalVisible: true, devToolsVisible: true });
      const slots = result.current.topBarSlots;

      expect(findSlot(slots, "experimental")?.action.appearance).toBe("accent");
      expect(findSlot(slots, "devtools")?.action.appearance).toBe("accent");
    });

    it("synchronize slot is not interactive when isRotating is true", () => {
      const { result } = setup({ isRotating: true });

      expect(findSlot(result.current.topBarSlots, "synchronize")?.action.isInteractive).toBe(false);
    });

    it("history slot is a dedicated slot type (not an action)", () => {
      const { result } = setup();
      const historySlot = result.current.topBarSlots.find(s => s.type === "history");

      expect(historySlot).toBeDefined();
    });
  });

  describe("inManager", () => {
    it("returns true when pathname is /manager", () => {
      const { result } = setup({ route: "/manager" });
      expect(result.current.inManager).toBe(true);
    });

    it("returns false for other pathnames", () => {
      const { result } = setup();
      expect(result.current.inManager).toBe(false);
    });
  });
});
