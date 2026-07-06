import { estimateFees } from "./estimateFees";

// FIXME: a real fee estimate requires a funded sender address (craftTransaction needs its
// spendable UTXOs to compute the mass-based fee). No such fixture could be verified from this
// environment (no network access to the Kaspa endpoint) — enable once a funded sender fixture is
// confirmed against api.mdx's expectations (estimate and parameters > 0, no error for a valid
// send).
describe.skip("estimateFees (integration)", () => {
  it("estimates a positive fee for a valid send", () => {
    throw new Error("FIXME: supply a verified funded kaspa: sender fixture");
  });
});
