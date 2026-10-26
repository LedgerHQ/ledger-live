import { describe, expect, it } from "@jest/globals";
import type { UnknownAction } from "@reduxjs/toolkit";
import {
  appConfigReducer,
  removeAppConfigDevValue,
  resetAppConfigSelection,
  selectAppConfigOption,
  setAppConfigDevValue,
} from "./slice";
import { rejectDevValue, setSession } from "./internals/slice";
import type { AppConfigState, ConfigOptionId } from "./types";

const switches = {
  backend: {
    label: "Backend",
    options: {
      prod: { apiUrl: "https://api.example.com" },
      staging: { apiUrl: "https://api.stg.example.com" },
    },
  },
};

describe("appConfigReducer", () => {
  it("saves the selections and dev values of the session it is set to", () => {
    const state = resolved({
      selections: { backend: "staging" },
      devValues: { apiUrl: "http://localhost:3000" },
    });

    expect(state.savedSelections).toEqual({ backend: "staging" });
    expect(state.savedDevValues).toEqual({ apiUrl: "http://localhost:3000" });
    expect(state.devValueErrors).toEqual({});
  });

  it("saves a selected option of a declared switch", () => {
    const state = appConfigReducer(
      resolved(),
      selectAppConfigOption({ id: "backend", selectionId: "staging" }),
    );

    expect(state.savedSelections).toEqual({ backend: "staging" });
    expect(state.session?.selections).toEqual({});
  });

  it("saves Dev for a switch and a fixed value when the default is staging", () => {
    let state = resolved({ defaultOptionId: "staging" });

    state = appConfigReducer(state, selectAppConfigOption({ id: "backend", selectionId: "dev" }));
    state = appConfigReducer(
      state,
      selectAppConfigOption({ id: "clientVersion", selectionId: "dev" }),
    );

    expect(state.savedSelections).toEqual({ backend: "dev", clientVersion: "dev" });
  });

  it.each([
    ["an undeclared switch", "staging", { id: "unknown", selectionId: "staging" }],
    ["an inherited property", "staging", { id: "toString", selectionId: "staging" }],
    ["a value instead of an option id", "staging", { id: "backend", selectionId: "https://a.com" }],
    ["a missing selection id", "staging", { id: "backend" }],
    ["an option of a fixed value", "staging", { id: "clientVersion", selectionId: "staging" }],
    ["Dev when the default is prod", "prod", { id: "backend", selectionId: "dev" }],
  ] as const)("ignores a selection of %s", (_, defaultOptionId, payload) => {
    const state = resolved({ defaultOptionId, selections: { backend: "prod" } });

    // A caller outside TypeScript can dispatch anything.
    const action: UnknownAction = { type: selectAppConfigOption.type, payload };

    expect(appConfigReducer(state, action)).toBe(state);
  });

  it("ignores every change before the session is set", () => {
    const actions = [
      selectAppConfigOption({ id: "backend", selectionId: "staging" }),
      setAppConfigDevValue({ name: "apiUrl", value: "http://localhost:3000" }),
      rejectDevValue({ name: "apiUrl", value: "not a url", message: "Invalid URL" }),
    ];

    const state = actions.reduce<AppConfigState | undefined>(appConfigReducer, undefined);

    expect(state).toEqual(appConfigReducer(undefined, { type: "init" }));
  });

  it("removes the saved selection of a declared switch or fixed value", () => {
    let state = resolved({
      defaultOptionId: "staging",
      selections: { backend: "dev", clientVersion: "dev" },
    });

    state = appConfigReducer(state, resetAppConfigSelection("backend"));
    state = appConfigReducer(state, resetAppConfigSelection("clientVersion"));

    expect(state.savedSelections).toEqual({});
  });

  it("ignores a reset of an undeclared switch", () => {
    const state = resolved();

    expect(appConfigReducer(state, resetAppConfigSelection("unknown"))).toBe(state);
  });

  describe("dev values", () => {
    const rejection = rejectDevValue({
      name: "apiUrl",
      value: "not a url",
      message: "Invalid URL",
    });

    it("records a rejected dev value, and drops it once a dev value is saved", () => {
      let state = appConfigReducer(resolved({ defaultOptionId: "staging" }), rejection);

      expect(state.devValueErrors).toEqual({
        apiUrl: { value: "not a url", message: "Invalid URL" },
      });

      state = appConfigReducer(
        state,
        setAppConfigDevValue({ name: "apiUrl", value: "http://localhost:3000" }),
      );

      expect(state.savedDevValues).toEqual({ apiUrl: "http://localhost:3000" });
      expect(state.devValueErrors).toEqual({});
    });

    it("removes a dev value and its error", () => {
      const state = appConfigReducer(
        appConfigReducer(
          resolved({ defaultOptionId: "staging", devValues: { apiUrl: "http://localhost:3000" } }),
          rejection,
        ),
        removeAppConfigDevValue("apiUrl"),
      );

      expect(state.savedDevValues).toEqual({});
      expect(state.devValueErrors).toEqual({});
    });

    it.each([
      ["a name that is no value", "unknown"],
      ["an inherited property", "toString"],
    ])("ignores the dev value of %s", (_, name) => {
      const state = resolved({ defaultOptionId: "staging" });

      expect(appConfigReducer(state, setAppConfigDevValue({ name, value: "value" }))).toBe(state);
    });

    it("holds only serializable state", () => {
      const state = appConfigReducer(resolved({ defaultOptionId: "staging" }), rejection);

      expect(JSON.parse(JSON.stringify(state))).toEqual(state);
    });
  });
});

/** The slice once the middleware has set a session that booted with `selections` and `devValues`. */
function resolved({
  defaultOptionId = "prod",
  selections = {},
  devValues = {},
}: {
  defaultOptionId?: ConfigOptionId;
  selections?: AppConfigState["savedSelections"];
  devValues?: AppConfigState["savedDevValues"];
} = {}) {
  return appConfigReducer(
    undefined,
    setSession({
      switches,
      fixed: { clientVersion: "test/1.0.0" },
      default: defaultOptionId,
      selections,
      values: {},
      devValues,
    }),
  );
}
