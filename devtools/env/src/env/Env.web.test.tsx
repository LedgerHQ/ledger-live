import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Env from "./Env";
import type { EnvVarEntry } from "../types";

function makeEntry(overrides: Partial<EnvVarEntry> = {}): EnvVarEntry {
  return {
    key: "MY_VAR",
    value: "current_val",
    defaultValue: "default_val",
    desc: "my description",
    isOverridden: false,
    ...overrides,
  };
}

describe("Env.web", () => {
  describe("filter", () => {
    it("should render all entries when query is empty", () => {
      const entries = [makeEntry({ key: "VAR_A" }), makeEntry({ key: "VAR_B" })];
      render(<Env envVars={entries} onOverride={jest.fn()} onReset={jest.fn()} />);
      expect(screen.getByText("VAR_A")).toBeVisible();
      expect(screen.getByText("VAR_B")).toBeVisible();
    });

    it("should filter entries by key (case-insensitive)", async () => {
      const entries = [makeEntry({ key: "VAR_ALPHA" }), makeEntry({ key: "VAR_BETA" })];
      render(<Env envVars={entries} onOverride={jest.fn()} onReset={jest.fn()} />);
      const filterInput = screen.getByPlaceholderText("Filter env vars…");
      await userEvent.type(filterInput, "alpha");
      expect(screen.getByText("VAR_ALPHA")).toBeVisible();
      expect(screen.queryByText("VAR_BETA")).toBeNull();
    });

    it("should filter entries by desc (case-insensitive)", async () => {
      const entries = [
        makeEntry({ key: "VAR_A", desc: "foo description" }),
        makeEntry({ key: "VAR_B", desc: "bar description" }),
      ];
      render(<Env envVars={entries} onOverride={jest.fn()} onReset={jest.fn()} />);
      const filterInput = screen.getByPlaceholderText("Filter env vars…");
      await userEvent.type(filterInput, "foo");
      expect(screen.getByText("VAR_A")).toBeVisible();
      expect(screen.queryByText("VAR_B")).toBeNull();
    });

    it("should show all entries when query only has whitespace", async () => {
      const entries = [makeEntry({ key: "VAR_A" }), makeEntry({ key: "VAR_B" })];
      render(<Env envVars={entries} onOverride={jest.fn()} onReset={jest.fn()} />);
      const filterInput = screen.getByPlaceholderText("Filter env vars…");
      await userEvent.type(filterInput, "   ");
      expect(screen.getByText("VAR_A")).toBeVisible();
      expect(screen.getByText("VAR_B")).toBeVisible();
    });
  });

  describe("EnvRow draft and commit", () => {
    it("should call onOverride with new value when input is changed and blurred", () => {
      const onOverride = jest.fn();
      render(<Env envVars={[makeEntry()]} onOverride={onOverride} onReset={jest.fn()} />);
      const input = screen.getByDisplayValue("current_val");
      fireEvent.change(input, { target: { value: "new_val" } });
      fireEvent.blur(input);
      expect(onOverride).toHaveBeenCalledWith("MY_VAR", "new_val");
    });

    it("should call onOverride when Enter is pressed", () => {
      const onOverride = jest.fn();
      render(<Env envVars={[makeEntry()]} onOverride={onOverride} onReset={jest.fn()} />);
      const input = screen.getByDisplayValue("current_val");
      fireEvent.change(input, { target: { value: "enter_val" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onOverride).toHaveBeenCalledWith("MY_VAR", "enter_val");
    });

    it("should NOT call onOverride when value is unchanged on blur", () => {
      const onOverride = jest.fn();
      render(<Env envVars={[makeEntry()]} onOverride={onOverride} onReset={jest.fn()} />);
      const input = screen.getByDisplayValue("current_val");
      fireEvent.blur(input);
      expect(onOverride).not.toHaveBeenCalled();
    });

    it("should reset draft to entry value when Escape is pressed", () => {
      render(<Env envVars={[makeEntry()]} onOverride={jest.fn()} onReset={jest.fn()} />);
      const input = screen.getByDisplayValue("current_val") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "typed_val" } });
      expect(input.value).toBe("typed_val");
      fireEvent.keyDown(input, { key: "Escape" });
      expect(input.value).toBe("current_val");
    });
  });

  describe("EnvRow reset button", () => {
    it("should not show reset button when entry is not overridden", () => {
      render(
        <Env
          envVars={[makeEntry({ isOverridden: false })]}
          onOverride={jest.fn()}
          onReset={jest.fn()}
        />,
      );
      expect(screen.queryByTitle(/Reset to:/)).toBeNull();
    });

    it("should show reset button when entry is overridden", () => {
      render(
        <Env
          envVars={[makeEntry({ isOverridden: true, defaultValue: "def_val" })]}
          onOverride={jest.fn()}
          onReset={jest.fn()}
        />,
      );
      expect(screen.getByTitle("Reset to: def_val")).toBeVisible();
    });

    it("should call onReset when reset button is clicked", async () => {
      const onReset = jest.fn();
      render(
        <Env
          envVars={[makeEntry({ isOverridden: true, defaultValue: "def_val" })]}
          onOverride={jest.fn()}
          onReset={onReset}
        />,
      );
      await userEvent.click(screen.getByTitle("Reset to: def_val"));
      expect(onReset).toHaveBeenCalledWith("MY_VAR");
    });
  });
});
