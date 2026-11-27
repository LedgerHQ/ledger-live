import { runMinaRedelegateTest } from "@e2e/specs/delegate/delegate";

// Broadcasting is left to the nightly policy: moving a delegation leaves the account delegated, so
// this flow reproduces its own precondition on an account no other flow touches.
runMinaRedelegateTest({
  tmsLinks: ["B2CQA-6627"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@mina", "@family-mina"],
});
