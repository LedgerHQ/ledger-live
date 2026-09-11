import { runMinaUndelegateTest } from "@e2e/specs/delegate/delegate";

// Broadcasting is left to the nightly policy: this flow frees a delegated account, which the
// delegate flow stakes back.
runMinaUndelegateTest(
  ["B2CQA-387"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@mina", "@family-mina"],
);
