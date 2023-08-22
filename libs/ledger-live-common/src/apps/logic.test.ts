import {
  initState,
  reducer,
  /*
  distribute,
  getActionPlan,
  predictOptimisticState,
  */
  updateAllProgress,
  getNextAppOp,
} from "./logic";
import { /*runAll,*/ runOneAppOp } from "./runner";
import { deviceInfo155, mockListAppsResult, mockExecWithInstalledContext } from "./mock";
// import { prettyActionPlan, prettyInstalled } from "./formatting";
import { setEnv } from "@ledgerhq/live-env";
import { Action } from "./types";

setEnv("MANAGER_INSTALL_DELAY", 0);
// TODO reactivate this test after bitcoin 2.1.0 nano app

/*
const scenarios = [
  {
    name: "wipe installed apps",
    apps: "Bitcoin Legacy, Ethereum, Litecoin, Dogecoin, Ethereum Classic, XRP",
    installed: "Bitcoin Legacy, Litecoin, XRP, Ethereum Classic, Ethereum",
    actions: [
      {
        dispatch: {
          type: "wipe",
        },
        expectPlan:
          "-Litecoin, -Bitcoin Legacy, -XRP, -Ethereum Classic, -Ethereum",
        expectInstalled: "",
      },
    ],
  },
  {
    name: "install an app install its dep",
    apps: "Bitcoin Legacy, Litecoin, Dogecoin",
    installed: "",
    actions: [
      {
        dispatch: {
          type: "install",
          name: "Dogecoin",
        },
        expectPlan: "+Bitcoin Legacy, +Dogecoin",
        expectInstalled: "Bitcoin Legacy, Dogecoin",
      },
      {
        dispatch: {
          type: "install",
          name: "Litecoin",
        },
        expectPlan: "+Litecoin",
        expectInstalled: "Bitcoin Legacy, Dogecoin, Litecoin",
      },
    ],
  },
  {
    name: "install and uninstall an app",
    apps: "XRP",
    installed: "",
    actions: [
      {
        dispatch: {
          type: "install",
          name: "XRP",
        },
        expectPlan: "+XRP",
        expectInstalled: "XRP",
      },
      {
        dispatch: {
          type: "uninstall",
          name: "XRP",
        },
        expectPlan: "-XRP",
        expectInstalled: "",
      },
    ],
  },
  {
    name: "install an app install its dep",
    apps: "Bitcoin Legacy, Litecoin, Dogecoin",
    installed: "",
    actions: [
      {
        dispatch: {
          type: "install",
          name: "Dogecoin",
        },
        expectPlan: "+Bitcoin Legacy, +Dogecoin",
        expectInstalled: "Bitcoin Legacy, Dogecoin",
      },
      {
        dispatch: {
          type: "install",
          name: "Litecoin",
        },
        expectPlan: "+Litecoin",
        expectInstalled: "Bitcoin Legacy, Dogecoin, Litecoin",
      },
    ],
  },
  {
    name: "uninstall an app that have deps",
    apps: "Bitcoin Legacy, Litecoin, Dogecoin",
    installed: "Bitcoin Legacy, Litecoin, Dogecoin",
    actions: [
      {
        dispatch: {
          type: "uninstall",
          name: "Bitcoin Legacy",
        },
        expectPlan: "-Litecoin, -Dogecoin, -Bitcoin Legacy",
        expectInstalled: "",
      },
    ],
  },
  {
    name: "install existing is noop",
    apps: "Bitcoin Legacy",
    installed: "Bitcoin Legacy",
    actions: [
      {
        dispatch: {
          type: "install",
          name: "Bitcoin Legacy",
        },
        expectPlan: "",
        expectInstalled: "Bitcoin Legacy",
      },
    ],
  },
  {
    name: "uninstall non-existing is noop",
    apps: "Bitcoin Legacy",
    installed: "",
    actions: [
      {
        dispatch: {
          type: "uninstall",
          name: "Bitcoin Legacy",
        },
        expectPlan: "",
        expectInstalled: "",
      },
    ],
  },
  {
    name: "install an outdated app",
    apps: "Bitcoin Legacy",
    installed: "Bitcoin Legacy (outdated)",
    actions: [
      {
        dispatch: {
          type: "install",
          name: "Bitcoin Legacy",
        },
        expectPlan: "-Bitcoin Legacy, +Bitcoin Legacy",
        expectInstalled: "Bitcoin Legacy",
      },
    ],
  },
  {
    name: "install an outdated app dep",
    apps: "Bitcoin Legacy, Dogecoin",
    installed: "Bitcoin Legacy (outdated), Dogecoin (outdated)",
    actions: [
      {
        dispatch: {
          type: "install",
          name: "Dogecoin",
        },
        expectPlan: "-Dogecoin, -Bitcoin Legacy, +Bitcoin Legacy, +Dogecoin",
        expectInstalled: "Bitcoin Legacy, Dogecoin",
      },
    ],
  },
  {
    name: "install an app with outdated dep",
    apps: "Bitcoin Legacy, Litecoin, Dogecoin",
    installed: "Bitcoin Legacy (outdated), Litecoin (outdated)",
    actions: [
      {
        dispatch: {
          type: "install",
          name: "Dogecoin",
        },
        expectPlan:
          "-Litecoin, -Bitcoin Legacy, +Bitcoin Legacy, +Litecoin, +Dogecoin",
        expectInstalled: "Bitcoin Legacy, Litecoin, Dogecoin",
      },
    ],
  },
  {
    name: "install an outdated app with dependents",
    apps: "Bitcoin Legacy, Dogecoin",
    installed: "Bitcoin Legacy (outdated), Dogecoin (outdated)",
    actions: [
      {
        dispatch: {
          type: "install",
          name: "Bitcoin Legacy",
        },
        expectPlan: "-Dogecoin, -Bitcoin Legacy, +Bitcoin Legacy, +Dogecoin",
        expectInstalled: "Bitcoin Legacy, Dogecoin",
      },
    ],
  },
  {
    name: "update all will reinstall the outdated",
    apps: "Bitcoin Legacy, Litecoin, Ethereum",
    installed: "Bitcoin Legacy (outdated), Litecoin (outdated), Ethereum",
    actions: [
      {
        dispatch: {
          type: "updateAll",
        },
        expectPlan: "-Litecoin, -Bitcoin Legacy, +Bitcoin Legacy, +Litecoin",
        expectInstalled: "Ethereum, Bitcoin Legacy, Litecoin",
      },
    ],
  },
  {
    name: "update all still works with unknown apps",
    apps: "Bitcoin Legacy, Litecoin, Ethereum",
    installed:
      "Bitcoin Legacy (outdated), Litecoin (outdated), Ethereum, Unknown",
    actions: [
      {
        dispatch: {
          type: "updateAll",
        },
        expectPlan: "-Litecoin, -Bitcoin Legacy, +Bitcoin Legacy, +Litecoin",
        expectInstalled: "Ethereum, Unknown, Bitcoin Legacy, Litecoin",
      },
    ],
  },
  {
    name: "install and uninstall will undo (if top level dep)",
    apps: "Bitcoin Legacy",
    installed: "",
    actions: [
      {
        dispatch: [
          {
            type: "install",
            name: "Bitcoin Legacy",
          },
          {
            type: "uninstall",
            name: "Bitcoin Legacy",
          },
        ],
        expectPlan: "",
        expectInstalled: "",
      },
    ],
  },
  {
    name: "order is preserved in install action plan",
    apps: "Bitcoin Legacy, XRP, Ethereum, Ethereum Classic, Dogecoin, Zcash",
    installed: "",
    actions: [
      {
        dispatch: [
          {
            type: "install",
            name: "XRP",
          },
          {
            type: "install",
            name: "Ethereum Classic",
          },
          {
            type: "install",
            name: "Dogecoin",
          },
          {
            type: "install",
            name: "Zcash",
          },
        ],
        expectPlan:
          "+XRP, +Ethereum, +Ethereum Classic, +Bitcoin Legacy, +Dogecoin, +Zcash",
        expectInstalled:
          "XRP, Ethereum, Ethereum Classic, Bitcoin Legacy, Dogecoin, Zcash",
      },
    ],
  },
  {
    name: "order is preserved in uninstall action plan",
    apps: "Bitcoin Legacy, XRP, Ethereum, Ethereum Classic, Dogecoin, Zcash",
    installed:
      "XRP, Ethereum, Ethereum Classic, Bitcoin Legacy, Dogecoin, Zcash",
    actions: [
      {
        dispatch: [
          {
            type: "uninstall",
            name: "XRP",
          },
          {
            type: "uninstall",
            name: "Ethereum",
          },
          {
            type: "uninstall",
            name: "Dogecoin",
          },
          {
            type: "uninstall",
            name: "Bitcoin Legacy",
          },
        ],
        expectPlan:
          "-XRP, -Ethereum Classic, -Ethereum, -Dogecoin, -Bitcoin Legacy",
        expectInstalled: "",
      },
    ],
  },
];

scenarios.forEach((scenario) => {
  test("Scenario: " + scenario.name, async () => {
    let state = initState(
      mockListAppsResult(scenario.apps, scenario.installed, deviceInfo155)
    );
    expect(prettyActionPlan(getActionPlan(state))).toBe("");

    for (const action of scenario.actions) {
      state = (<any[]>[]).concat(action.dispatch).reduce(reducer, state);
      expect(prettyActionPlan(getActionPlan(state))).toBe(action.expectPlan);
      const optimisticState = predictOptimisticState(state);
      state = await runAll(
        state,
        mockExecWithInstalledContext(state.installed)
      ).toPromise();

      if (action.expectInstalled) {
        expect(prettyInstalled(state.installed)).toBe(action.expectInstalled);
      }
      state.currentProgressSubject = null;
      expect(state).toEqual(optimisticState);
      expect(prettyActionPlan(getActionPlan(state))).toBe("");
      const d: any = distribute(state);
      d.apps = d.apps.map(({ currency, ...rest }) => ({
        ...rest,
        currencyId: currency && currency.id,
      }));
      expect(d).toMatchSnapshot();
    }
  });
});

test("appsToRestore", async () => {
  const state = initState(
    mockListAppsResult(
      "Bitcoin Legacy, XRP, Ethereum, Ethereum Classic, Dogecoin, Zcash",
      "Bitcoin Legacy, Zcash",
      deviceInfo155
    ),
    ["Bitcoin Legacy", "XRP", "Dogecoin", "Zcash", "Ethereum Classic"]
  );
  expect(prettyActionPlan(getActionPlan(state))).toBe(
    "+XRP, +Dogecoin, +Ethereum, +Ethereum Classic"
  );
});
*/
/*
test("a lock error that occurs will not cancel the queue, another error will", () => {
  let state = initState(
    mockListAppsResult(
      "Bitcoin Legacy, XRP, Ethereum, Ethereum Classic, Dogecoin, Zcash",
      "",
      deviceInfo155
    )
  );

  state = [
    { type: "install", name: "Dogecoin" },
    { type: "install", name: "Ethereum Classic" }
  ].reduce(reducer, state);

  const plan = getActionPlan(state);

  state = reducer(state, {
    type: "onRunnerEvent",
    event: {
      type: "runError",
      appOp: plan[0],
      error: new ManagerDeviceLockedError()
    }
  });

  expect(getActionPlan(state)).toEqual(plan);
  expect(state.currentError).toEqual({
    appOp: plan[0],
    error: new ManagerDeviceLockedError()
  });

  state = reducer(state, { type: "recover" });
  expect(state.currentError).toBe(null);

  state = reducer(state, {
    type: "onRunnerEvent",
    event: {
      type: "runError",
      appOp: plan[0],
      error: new Error()
    }
  });

  expect(getActionPlan(state)).toEqual([]);
});
*/
test("global progress", async () => {
  let state = initState(
    mockListAppsResult(
      "Bitcoin Legacy, XRP, Ethereum, Ethereum Classic, Dogecoin, Zcash",
      "Bitcoin Legacy (outdated), Ethereum (outdated)",
      deviceInfo155,
    ),
  );
  expect(updateAllProgress(state)).toBe(1);
  state = [
    <Action>{
      type: "updateAll",
    },
  ].reduce(reducer, state);
  expect(updateAllProgress(state)).toBe(0);
  let next;
  let i = 0;
  const total = 4;

  while ((next = getNextAppOp(state))) {
    state = await runOneAppOp(
      state,
      next,
      mockExecWithInstalledContext(state.installed),
    ).toPromise();
    expect(updateAllProgress(state)).toBe(++i / total);
  }

  expect(i).toBe(total);
  expect(updateAllProgress(state)).toBe(1);
});
