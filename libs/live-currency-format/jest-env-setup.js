const { injectDefinitions, intParser } = require("@ledgerhq/live-env");
injectDefinitions({
  BIG_NUMBER_DECIMAL_PLACES: {
    def: 40,
    parser: intParser,
    desc: "bignumber.js decimal places configuration",
  },
});
