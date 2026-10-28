"use strict";

// Waivers for BARREL_LOCATION (rules.js), keyed by posix path from the repo root: the debt found
// when the check landed. The list only shrinks: a test fails on an entry whose file is gone or
// allowed.

const { BARREL_LOCATION } = require("./rules");

/**
 * @param {keyof typeof BARREL_LOCATION} code
 * @returns {string}
 */
function waiver(code) {
  const { rule, fix } = BARREL_LOCATION[code];
  return `TEMPORARY. ${rule}. Exit condition: ${fix}, then delete this entry.`;
}

const ORPHAN = waiver("orphan-barrel");

/** @type {Record<string, string>} */
const INTERMEDIATE_BARREL_WAIVERS = {
  "domain/api/currency-fiat/src/fixtures/index.ts": ORPHAN,
  "domain/api/currency-token/src/fixtures/index.ts": ORPHAN,
  "domain/entity/currency-crypto/src/currencies/index.ts": ORPHAN,
  "domain/entity/currency-fiat/src/currencies/index.ts": ORPHAN,
  "features/flow/fear-and-greed/src/components/Card/index.ts": ORPHAN,
  "features/flow/fear-and-greed/src/components/Definition/index.ts": ORPHAN,
  "features/flow/fear-and-greed/src/components/ExpandedCard/index.ts": ORPHAN,
  "features/flow/fear-and-greed/src/components/Indicator/index.ts": ORPHAN,
  "features/flow/flow-contacts-list/src/utils/index.ts": ORPHAN,
  "features/flow/pay-card-transactions/src/CardTransactionHistory/components/StatusMessage/index.native.ts":
    ORPHAN,
  "features/flow/pay-card-transactions/src/CardTransactionHistory/components/StatusMessage/index.web.ts":
    ORPHAN,
  "features/flow/pay-card-transactions/src/CardTransactions/components/DetailRow/index.ts": ORPHAN,
  "features/flow/pay-card-transactions/src/CardTransactions/components/List/index.ts": ORPHAN,
  "features/platform/currencies/src/fixtures/index.ts": ORPHAN,
  "shared/feature-flags/src/flags/index.ts": ORPHAN,
  "shared/feature-flags/src/flags/team-coin-integration/index.ts": ORPHAN,
  "shared/feature-flags/src/flags/team-engagement/index.ts": ORPHAN,
  "shared/feature-flags/src/flags/team-live-devices/index.ts": ORPHAN,
  "shared/feature-flags/src/flags/team-platform/index.ts": ORPHAN,
  "shared/feature-flags/src/flags/team-ptx/index.ts": ORPHAN,
  "shared/feature-flags/src/flags/team-recover-software/index.ts": ORPHAN,
  "shared/feature-flags/src/flags/team-wallet-xp/index.ts": ORPHAN,
};

module.exports = { INTERMEDIATE_BARREL_WAIVERS };
