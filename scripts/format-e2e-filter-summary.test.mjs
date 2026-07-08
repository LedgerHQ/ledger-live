import assert from "node:assert/strict";
import { test } from "node:test";

import { formatFilterSummary } from "./format-e2e-filter-summary.mjs";

const LABEL = "- **Filtered pattern:**";

test("renders (none) for empty or explicit-none input", () => {
  assert.equal(formatFilterSummary(""), `${LABEL} (none)`);
  assert.equal(formatFilterSummary("   "), `${LABEL} (none)`);
  assert.equal(formatFilterSummary("(none)"), `${LABEL} (none)`);
});

test("renders a single pattern inline", () => {
  assert.equal(formatFilterSummary("@bitcoin"), `${LABEL} @bitcoin`);
});

test("renders multiple patterns as a nested bullet list", () => {
  assert.equal(
    formatFilterSummary("@bitcoin|@family-evm|@solana"),
    [`${LABEL} (3 patterns)`, "  - @bitcoin", "  - @family-evm", "  - @solana"].join("\n"),
  );
});

test("splits comma-separated filters (raw mobile test_filter input)", () => {
  assert.equal(
    formatFilterSummary("@bitcoin,@family-evm|Accounts"),
    [`${LABEL} (3 patterns)`, "  - @bitcoin", "  - @family-evm", "  - Accounts"].join("\n"),
  );
});

test("does not split on escaped commas inside a title", () => {
  const input = "Sync instances\\, rename(?! [^@])|Another test(?! [^@])";
  assert.equal(
    formatFilterSummary(input),
    [`${LABEL} (2 patterns)`, "  - Sync instances, rename", "  - Another test"].join("\n"),
  );
});

test("strips the Playwright leaf anchor and unescapes regex characters", () => {
  const input =
    "Entry Point \\- Asset Allocation(?! [^@])|Sync instances\\, rename and delete accounts(?! [^@])|\\[Tezos\\] Receive(?! [^@])";
  assert.equal(
    formatFilterSummary(input),
    [
      `${LABEL} (3 patterns)`,
      "  - Entry Point - Asset Allocation",
      "  - Sync instances, rename and delete accounts",
      "  - [Tezos] Receive",
    ].join("\n"),
  );
});

test("does not split on escaped separators inside a title", () => {
  const input = "Send A \\| B(?! [^@])|Another test(?! [^@])";
  assert.equal(
    formatFilterSummary(input),
    [`${LABEL} (2 patterns)`, "  - Send A | B", "  - Another test"].join("\n"),
  );
});

test("only unescapes the summary's literal escapes, preserving real regex escapes", () => {
  assert.equal(
    formatFilterSummary("Amount \\d\\d\\.\\d\\d \\[USD\\]"),
    `${LABEL} Amount \\d\\d.\\d\\d [USD]`,
  );
  assert.equal(formatFilterSummary("word \\b boundary"), `${LABEL} word \\b boundary`);
});
