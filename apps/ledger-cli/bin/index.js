#!/usr/bin/env node

const origWarning = process.emitWarning;
process.emitWarning = function (...args) {
  if (!["DEP0005", "DEP0040"].includes(args[2])) {
    return origWarning.apply(process, args);
  }
};

require("../lib/index.cjs");
