import { Application } from "@ledgerhq/types-live";
import { polyfillApplication } from "./polyfill";

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
    compatibleWalletsJSON: undefined,
  };
  const polyfilled = polyfillApplication(app);
  expect(polyfilled.currencyId).toEqual("ethereum");
});
