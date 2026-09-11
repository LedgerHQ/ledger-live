import { runMinaDelegateTest } from "@e2e/specs/delegate/delegate";

// Broadcasting is left to the nightly policy: this flow stakes the pool's free account, which the
// undelegate flow replaces.
runMinaDelegateTest(
  ["B2CQA-387"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@mina", "@family-mina"],
);
