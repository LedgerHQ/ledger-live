import type { CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "../types";

// The Zcash chain adapter requires a DMK transport (see
// `src/chain-adapters/zcash/index.ts`), so account scanning cannot be exercised
// through the legacy `hw-transport-mocker` APDU replayer used by this suite.
// `scanAccounts` is intentionally omitted until a DMK-aware integration harness
// is wired in; only the basic currency bridge contract is asserted here.
const dataset: CurrenciesData<Transaction> = {};
export default dataset;
