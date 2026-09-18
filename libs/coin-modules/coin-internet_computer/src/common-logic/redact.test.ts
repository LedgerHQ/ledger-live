import { redactPrincipals } from "./redact";

// A self-authenticating principal, as a controller's is: 29 bytes, so eleven groups. It has to be a
// real one — redaction parses each candidate, so a fabricated string would not be recognized.
const PRINCIPAL = "3hbau-tidbi-irqhz-gfu2d-wqsjk-blv4z-lmon5-idcep-s2o2j-k5sxh-aae";
const CANISTER_ID = "rrkah-fqaaa-aaaaa-aaaaq-cai";

describe("redactPrincipals", () => {
  it("replaces a principal in the middle of a rejection message", () => {
    expect(redactPrincipals(`Caller ${PRINCIPAL} is not authorized to manage neuron 1234`)).toBe(
      "Caller <hidden> is not authorized to manage neuron 1234",
    );
  });

  it("leaves nothing of the principal behind", () => {
    const redacted = redactPrincipals(`Caller ${PRINCIPAL} is not authorized.`);

    expect(redacted).not.toContain(PRINCIPAL);
    // Not a prefix either: a partial match would leave enough to identify the account.
    expect(redacted).not.toContain(PRINCIPAL.slice(0, 11));
  });

  it("replaces every principal in a message that names more than one", () => {
    const redacted = redactPrincipals(`${PRINCIPAL} cannot call ${CANISTER_ID}`);

    expect(redacted).toBe("<hidden> cannot call <hidden>");
  });

  // The reason is the part worth showing; redaction must not swallow it.
  it.each([
    "Neuron not found",
    "The dissolve delay is too long",
    "Insufficient funds to disburse",
    "Neuron is already dissolving",
    "Requested amount 12345678 exceeds the neuron stake",
  ])("leaves %s untouched", message => {
    expect(redactPrincipals(message)).toBe(message);
  });

  // Two groups is the management canister, "aaaaa-aa" — not an account. Requiring three keeps
  // ordinary hyphenated words out of the match.
  it.each(["aaaaa-aa", "hot-key", "auto-stake-maturity", "well-known-topic"])(
    "leaves the hyphenated token %s alone",
    text => {
      expect(redactPrincipals(text)).toBe(text);
    },
  );

  // Base32 covers the whole alphabet, so three hyphenated five-letter words have a principal's exact
  // shape. Matching on shape alone took the reason with them.
  it.each(["total-stake-limit", "stake-delay-value-limit", "Rejected: total-stake-limit exceeded"])(
    "leaves the principal-shaped prose %s alone",
    text => {
      expect(redactPrincipals(text)).toBe(text);
    },
  );

  it("returns an empty string unchanged", () => {
    expect(redactPrincipals("")).toBe("");
  });
});
