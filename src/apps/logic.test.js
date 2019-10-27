// @flow
import {
  initState,
  reducer,
  distribute,
  getActionPlan,
  predictOptimisticState
} from "./logic";
import { runAll } from "./runner";
import {
  deviceInfo155,
  mockListAppsResult,
  mockExecWithInstalledContext
} from "./mock";
import { prettyActionPlan, prettyInstalled } from "./formatting";
import { setEnv } from "../env";

setEnv("MANAGER_INSTALL_DELAY", 0);

const scenarios = [
  {
    name: "wipe installed apps",
    apps: "Bitcoin, Ethereum, Litecoin, Dogecoin, Ethereum Classic, XRP",
    installed: "Bitcoin, Litecoin, XRP, Ethereum Classic, Ethereum",
    actions: [
      {
        dispatch: { type: "wipe" },
        expectPlan: "-Litecoin, -Bitcoin, -XRP, -Ethereum Classic, -Ethereum",
        expectInstalled: ""
      }
    ]
  },

  {
    name: "install an app install its dep",
    apps: "Bitcoin, Litecoin, Dogecoin",
    installed: "",
    actions: [
      {
        dispatch: { type: "install", name: "Dogecoin" },
        expectPlan: "+Bitcoin, +Dogecoin",
        expectInstalled: "Bitcoin, Dogecoin"
      },
      {
        dispatch: { type: "install", name: "Litecoin" },
        expectPlan: "+Litecoin",
        expectInstalled: "Bitcoin, Dogecoin, Litecoin"
      }
    ]
  },

  {
    name: "install and uninstall an app",
    apps: "XRP",
    installed: "",
    actions: [
      {
        dispatch: { type: "install", name: "XRP" },
        expectPlan: "+XRP",
        expectInstalled: "XRP"
      },
      {
        dispatch: { type: "uninstall", name: "XRP" },
        expectPlan: "-XRP",
        expectInstalled: ""
      }
    ]
  },

  {
    name: "install an app install its dep",
    apps: "Bitcoin, Litecoin, Dogecoin",
    installed: "",
    actions: [
      {
        dispatch: { type: "install", name: "Dogecoin" },
        expectPlan: "+Bitcoin, +Dogecoin",
        expectInstalled: "Bitcoin, Dogecoin"
      },
      {
        dispatch: { type: "install", name: "Litecoin" },
        expectPlan: "+Litecoin",
        expectInstalled: "Bitcoin, Dogecoin, Litecoin"
      }
    ]
  },

  {
    name: "uninstall an app that have deps",
    apps: "Bitcoin, Litecoin, Dogecoin",
    installed: "Bitcoin, Litecoin, Dogecoin",
    actions: [
      {
        dispatch: { type: "uninstall", name: "Bitcoin" },
        expectPlan: "-Litecoin, -Dogecoin, -Bitcoin",
        expectInstalled: ""
      }
    ]
  },

  {
    name: "install existing is noop",
    apps: "Bitcoin",
    installed: "Bitcoin",
    actions: [
      {
        dispatch: { type: "install", name: "Bitcoin" },
        expectPlan: "",
        expectInstalled: "Bitcoin"
      }
    ]
  },

  {
    name: "uninstall non-existing is noop",
    apps: "Bitcoin",
    installed: "",
    actions: [
      {
        dispatch: { type: "uninstall", name: "Bitcoin" },
        expectPlan: "",
        expectInstalled: ""
      }
    ]
  },

  {
    name: "install an outdated app",
    apps: "Bitcoin",
    installed: "Bitcoin (outdated)",
    actions: [
      {
        dispatch: { type: "install", name: "Bitcoin" },
        expectPlan: "-Bitcoin, +Bitcoin",
        expectInstalled: "Bitcoin"
      }
    ]
  },

  {
    name: "install an outdated app dep",
    apps: "Bitcoin, Dogecoin",
    installed: "Bitcoin (outdated), Dogecoin (outdated)",
    actions: [
      {
        dispatch: { type: "install", name: "Dogecoin" },
        expectPlan: "-Dogecoin, -Bitcoin, +Bitcoin, +Dogecoin",
        expectInstalled: "Bitcoin, Dogecoin"
      }
    ]
  },

  {
    name: "install an app with outdated dep",
    apps: "Bitcoin, Litecoin, Dogecoin",
    installed: "Bitcoin (outdated), Litecoin (outdated)",
    actions: [
      {
        dispatch: { type: "install", name: "Dogecoin" },
        expectPlan: "-Litecoin, -Bitcoin, +Bitcoin, +Litecoin, +Dogecoin",
        expectInstalled: "Bitcoin, Litecoin, Dogecoin"
      }
    ]
  },

  {
    name: "update all will reinstall the outdated",
    apps: "Bitcoin, Litecoin, Ethereum",
    installed: "Bitcoin (outdated), Litecoin (outdated), Ethereum",
    actions: [
      {
        dispatch: { type: "updateAll" },
        expectPlan: "-Litecoin, -Bitcoin, +Bitcoin, +Litecoin",
        expectInstalled: "Ethereum, Bitcoin, Litecoin"
      }
    ]
  },

  {
    name: "install and uninstall will undo (if top level dep)",
    apps: "Bitcoin",
    installed: "",
    actions: [
      {
        dispatch: [
          { type: "install", name: "Bitcoin" },
          { type: "uninstall", name: "Bitcoin" }
        ],
        expectPlan: "",
        expectInstalled: ""
      }
    ]
  },

  {
    name: "order is preserved in install action plan",
    apps: "Bitcoin, XRP, Ethereum, Ethereum Classic, Dogecoin, Zcash",
    installed: "",
    actions: [
      {
        dispatch: [
          { type: "install", name: "XRP" },
          { type: "install", name: "Ethereum Classic" },
          { type: "install", name: "Dogecoin" },
          { type: "install", name: "Zcash" }
        ],
        expectPlan:
          "+XRP, +Ethereum, +Ethereum Classic, +Bitcoin, +Dogecoin, +Zcash",
        expectInstalled:
          "XRP, Ethereum, Ethereum Classic, Bitcoin, Dogecoin, Zcash"
      }
    ]
  },

  {
    name: "order is preserved in uninstall action plan",
    apps: "Bitcoin, XRP, Ethereum, Ethereum Classic, Dogecoin, Zcash",
    installed: "XRP, Ethereum, Ethereum Classic, Bitcoin, Dogecoin, Zcash",
    actions: [
      {
        dispatch: [
          { type: "uninstall", name: "XRP" },
          { type: "uninstall", name: "Ethereum" },
          { type: "uninstall", name: "Dogecoin" },
          { type: "uninstall", name: "Bitcoin" }
        ],
        expectPlan:
          "-XRP, -Ethereum Classic, -Ethereum, -Dogecoin, -Zcash, -Bitcoin",
        expectInstalled: ""
      }
    ]
  }
];

scenarios.forEach(scenario => {
  test("Scenario: " + scenario.name, async () => {
    let state = initState(
      mockListAppsResult(scenario.apps, scenario.installed, deviceInfo155)
    );
    expect(prettyActionPlan(getActionPlan(state))).toBe("");

    for (let action of scenario.actions) {
      state = [].concat(action.dispatch).reduce(reducer, state);
      expect(prettyActionPlan(getActionPlan(state))).toBe(action.expectPlan);
      const optimisticState = predictOptimisticState(state);
      state = await runAll(
        state,
        mockExecWithInstalledContext(state.installed)
      ).toPromise();
      if (action.expectInstalled) {
        expect(prettyInstalled(state.installed)).toBe(action.expectInstalled);
      }
      expect(state).toEqual(optimisticState);
      expect(prettyActionPlan(getActionPlan(state))).toBe("");
      const d: any = distribute(state);
      d.apps = d.apps.map(({ currency, ...rest }) => ({
        ...rest,
        currencyId: currency && currency.id
      }));
      expect(d).toMatchSnapshot();
    }
  });
});

// TO DO test dispatch of actions DURING action plan execution
