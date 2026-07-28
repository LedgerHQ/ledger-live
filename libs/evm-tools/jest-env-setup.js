const { injectDefinitions, stringParser } = require("@ledgerhq/live-env");
injectDefinitions({
  CAL_SERVICE_URL: {
    def: "https://global.api.prd.ledger.com/cal",
    parser: stringParser,
    desc: "Cryptoassets list service url",
  },
});
