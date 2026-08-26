import { boolParser, stringParser } from "@ledgerhq/live-env";

const teamQaa = {
  DETOX: {
    def: "",
    parser: stringParser,
    desc: "switch the app into a DETOX mode for test purpose. Avoid falsy values.",
  },
  PLAYWRIGHT_RUN: {
    def: false,
    parser: boolParser,
    desc: "true when launched for E2E testing",
  },
  CARD_SESSION_BOOTSTRAP: {
    def: "",
    parser: stringParser,
    desc:
      "Test-only. A PayCardSession as JSON, injected at launch so the app starts signed in. " +
      "Honoured only in a dev build or under PLAYWRIGHT_RUN; a packaged build ignores it.",
  },
  E2E_NANO_APP_VERSION_PATH: {
    def: "",
    parser: stringParser,
    desc: "Path for e2e nanoApp version artifacts (LLD and LLM)",
  },
};

export default teamQaa;
