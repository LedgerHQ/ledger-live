import { runMinaRedelegateTest } from "@e2e/specs/delegate/delegate";

// Broadcasting is left to the nightly policy: this flow keeps its account delegated, and the pool
// gives it the one the undelegate flow leaves alone.
runMinaRedelegateTest(
  ["B2CQA-387"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@mina", "@family-mina"],
);
