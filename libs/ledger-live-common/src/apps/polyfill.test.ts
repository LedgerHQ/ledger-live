import { App, AppType, Application } from "@ledgerhq/types-live";
import { getDependencies, polyfillApplication } from "./polyfill";
import { calculateDependencies } from "./polyfill";

calculateDependencies();

test("polyfillApplication set ethereum currency for ethereum app", () => {
  const app: Application = {
    id: 1,
    name: "Ethereum",
    description: undefined,
    application_versions: [],
    providers: [],
    category: 0,
    date_creation: "",
    date_last_modified: "",
    publisher: undefined,
    currencyId: undefined,
    authorName: undefined,
    supportURL: undefined,
    contactURL: undefined,
    sourceURL: undefined,
  };
  const polyfilledApp = polyfillApplication(app);
  expect(polyfilledApp.currencyId).toEqual("ethereum");
});

const baseSampleApp: App = {
  id: 1,
  name: "Dogecoin",
  displayName: "Dogecoin",
  version: "2.0.6",
  currencyId: "",
  description: "",
  type: AppType.currency,
  dateModified: "2022-06-07T08:57:34.783551Z",
  icon: "dogecoin",
  authorName: "",
  supportURL: "",
  contactURL: "",
  sourceURL: "",
  perso: "perso_11",
  hash: "6298b2dc4b04d7aa4ddfeec2d98502c871f243af273463c5489ca89d4f2cf0ef",
  firmware: "nanos+/1.0.3-rc1/dogecoin/app_2.0.6",
  firmware_key: "nanos+/1.0.3-rc1/dogecoin/app_2.0.6_key",
  delete: "nanos+/1.0.3-rc1/dogecoin/app_2.0.6_del",
  delete_key: "nanos+/1.0.3-rc1/dogecoin/app_2.0.6_del_key",
  dependencies: [],
  bytes: 528,
  warning: "",
  indexOfMarketCap: 0,
  isDevTools: false,
};
describe("Dependency resolution for standalone currency apps", () => {
  test("Dogecoin 2.0.6 should have Bitcoin as dependency", () => {
    const app: App = { ...baseSampleApp };
    expect(getDependencies(app.name, app.version)).toEqual(["Bitcoin"]);
  });

  test("Dogecoin 2.0.6-rc1 should have Bitcoin as dependency", () => {
    const app: App = { ...baseSampleApp, version: "2.0.6-rc1" };
    expect(getDependencies(app.name, app.version)).toEqual(["Bitcoin"]);
  });

  test("Dogecoin 2.1.0 or greater should have no dependency", () => {
    const app: App = { ...baseSampleApp, version: "2.1.0" };
    expect(getDependencies(app.name, app.version)).toEqual([]);
  });

  test("Dogecoin 2.1.0-rc1 or greater should have no dependency", () => {
    const app: App = { ...baseSampleApp, version: "2.1.0-rc1" };
    expect(getDependencies(app.name, app.version)).toEqual([]);
  });
});

describe("Backwards compatibility, when not providing an app version", () => {
  test("Dogecoin should have Bitcoin as dependency", () => {
    const app: App = { ...baseSampleApp };
    expect(getDependencies(app.name, undefined)).toEqual(["Bitcoin"]);
  });
  test("Polygon should have Ethereum as dependency, even when providing a version", () => {
    // If this one is failing it means we've implemented a standalone polygon or a
    // version exemption like for Bitcoin, in that case we can drop this test.
    const app: App = { ...baseSampleApp, name: "Polygon" };
    expect(getDependencies(app.name, undefined)).toEqual(["Ethereum"]);
    expect(getDependencies(app.name, "4.3.2")).toEqual(["Ethereum"]);
  });
});
