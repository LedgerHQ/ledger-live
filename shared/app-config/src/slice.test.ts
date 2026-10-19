import { describe, expect, it } from "@jest/globals";
import type { UnknownAction } from "@reduxjs/toolkit";
import { appConfigReducer, resetAppConfigSwitch, selectAppConfigOption } from "./slice";
import { setSession } from "./internals/slice";
import type { AppConfigState } from "./types";

const switches = {
  backend: {
    label: "Backend",
    options: {
      prod: { apiUrl: "https://api.example.com" },
      staging: { apiUrl: "https://api.stg.example.com" },
    },
  },
};

/** The slice once the middleware has set a session that booted with `selections`. */
const resolved = (selections: AppConfigState["savedSelections"] = {}) =>
  appConfigReducer(undefined, setSession({ switches, default: "prod", selections }));

describe("appConfigReducer", () => {
  it("saves the selections of the session it is set to", () => {
    expect(resolved({ backend: "staging" }).savedSelections).toEqual({ backend: "staging" });
  });

  it("saves a selected option of a declared switch", () => {
    const state = appConfigReducer(
      resolved(),
      selectAppConfigOption({ switchId: "backend", optionId: "staging" }),
    );

    expect(state.savedSelections).toEqual({ backend: "staging" });
    expect(state.session?.selections).toEqual({});
  });

  it.each([
    ["an undeclared switch", { switchId: "unknown", optionId: "staging" }],
    ["an inherited property", { switchId: "toString", optionId: "staging" }],
    ["a value instead of an option id", { switchId: "backend", optionId: "https://api.com" }],
    ["a missing option id", { switchId: "backend" }],
  ])("ignores a selection of %s", (_, payload) => {
    const state = resolved({ backend: "staging" });

    // A caller outside TypeScript can dispatch anything.
    const action: UnknownAction = { type: selectAppConfigOption.type, payload };

    expect(appConfigReducer(state, action)).toBe(state);
  });

  it("ignores a selection before the session is set", () => {
    const state = appConfigReducer(
      undefined,
      selectAppConfigOption({ switchId: "backend", optionId: "staging" }),
    );

    expect(state.savedSelections).toEqual({});
  });

  it("removes the saved option of a declared switch", () => {
    const state = appConfigReducer(
      resolved({ backend: "staging" }),
      resetAppConfigSwitch("backend"),
    );

    expect(state.savedSelections).toEqual({});
  });

  it("ignores a reset of an undeclared switch", () => {
    const state = resolved();

    expect(appConfigReducer(state, resetAppConfigSwitch("unknown"))).toBe(state);
  });
});
