import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToolBar } from "./ToolBar.web";
import type { ToolBarInput, ToolBarFilters, ToolBarSort, ToolBarActions } from "./types.web";

interface PropsOverrides {
  filters?: Partial<ToolBarFilters>;
  sort?: Partial<ToolBarSort>;
  actions?: Partial<ToolBarActions>;
}

const makeProps = (overrides: PropsOverrides = {}): ToolBarInput => ({
  filters: {
    search: "",
    setSearch: jest.fn(),
    filter: "all",
    setFilter: jest.fn(),
    counts: { all: 4, enabled: 3, disabled: 2, overridden: 1 },
    ...overrides.filters,
  },
  sort: {
    category: "name",
    direction: "asc",
    cycleCategory: jest.fn(),
    toggleDirection: jest.fn(),
    ...overrides.sort,
  },
  actions: {
    clearAllOverrides: jest.fn(),
    exportOverrides: jest.fn(),
    importOverrides: jest.fn(),
    ...overrides.actions,
  },
});

describe("ToolBar", () => {
  it("renders the search input", () => {
    render(<ToolBar {...makeProps()} />);
    expect(screen.getByPlaceholderText("Search flags...")).toBeInTheDocument();
  });

  it("forwards typed search text to setSearch", async () => {
    const setSearch = jest.fn();
    const user = userEvent.setup();
    render(<ToolBar {...makeProps({ filters: { setSearch } })} />);
    await user.type(screen.getByPlaceholderText("Search flags..."), "x");
    expect(setSearch).toHaveBeenCalledWith("x");
  });

  describe("filters", () => {
    it("labels the overridden filter with its long and short label", () => {
      render(<ToolBar {...makeProps()} />);
      expect(screen.getByText("Overridden")).toBeInTheDocument();
      expect(screen.getByText("Over")).toBeInTheDocument();
    });

    it("shows the count for each filter", () => {
      render(
        <ToolBar
          {...makeProps({
            filters: { counts: { all: 4, enabled: 3, disabled: 2, overridden: 1 } },
          })}
        />,
      );
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("selects a filter when its segmented button is clicked", async () => {
      const setFilter = jest.fn();
      const user = userEvent.setup();
      render(<ToolBar {...makeProps({ filters: { setFilter } })} />);
      await user.click(screen.getByText("Overridden"));
      expect(setFilter).toHaveBeenCalledWith("overridden");
    });
  });

  describe("sort", () => {
    it("labels an ascending name sort as A→Z", () => {
      render(<ToolBar {...makeProps({ sort: { category: "name", direction: "asc" } })} />);
      expect(screen.getByRole("button", { name: "A→Z" })).toBeInTheDocument();
    });

    it("labels a descending name sort as Z→A", () => {
      render(<ToolBar {...makeProps({ sort: { category: "name", direction: "desc" } })} />);
      expect(screen.getByRole("button", { name: "Z→A" })).toBeInTheDocument();
    });

    it("labels the overridden sort", () => {
      render(<ToolBar {...makeProps({ sort: { category: "overridden" } })} />);
      expect(screen.getByRole("button", { name: "Overridden first" })).toBeInTheDocument();
    });

    it("labels the enabled sort", () => {
      render(<ToolBar {...makeProps({ sort: { category: "enabled" } })} />);
      expect(screen.getByRole("button", { name: "Enabled first" })).toBeInTheDocument();
    });

    it("cycles the sort category when the sort button is clicked", async () => {
      const cycleCategory = jest.fn();
      const user = userEvent.setup();
      render(<ToolBar {...makeProps({ sort: { cycleCategory } })} />);
      await user.click(screen.getByRole("button", { name: "A→Z" }));
      expect(cycleCategory).toHaveBeenCalledTimes(1);
    });

    it("toggles the sort direction when the direction control is clicked", async () => {
      const toggleDirection = jest.fn();
      const user = userEvent.setup();
      render(<ToolBar {...makeProps({ sort: { toggleDirection } })} />);
      await user.click(screen.getByRole("button", { name: "Sort ascending" }));
      expect(toggleDirection).toHaveBeenCalledTimes(1);
    });
  });

  describe("actions menu", () => {
    it("exports overrides", async () => {
      const exportOverrides = jest.fn();
      const user = userEvent.setup();
      render(<ToolBar {...makeProps({ actions: { exportOverrides } })} />);
      await user.click(screen.getByRole("button", { name: "Actions" }));
      await user.click(await screen.findByText("Export flags"));
      expect(exportOverrides).toHaveBeenCalledTimes(1);
    });

    it("imports overrides", async () => {
      const importOverrides = jest.fn();
      const user = userEvent.setup();
      render(<ToolBar {...makeProps({ actions: { importOverrides } })} />);
      await user.click(screen.getByRole("button", { name: "Actions" }));
      await user.click(await screen.findByText("Import flags"));
      expect(importOverrides).toHaveBeenCalledTimes(1);
    });

    it("resets all overrides", async () => {
      const clearAllOverrides = jest.fn();
      const user = userEvent.setup();
      render(<ToolBar {...makeProps({ actions: { clearAllOverrides } })} />);
      await user.click(screen.getByRole("button", { name: "Actions" }));
      await user.click(await screen.findByText("Reset all overrides"));
      expect(clearAllOverrides).toHaveBeenCalledTimes(1);
    });
  });
});
