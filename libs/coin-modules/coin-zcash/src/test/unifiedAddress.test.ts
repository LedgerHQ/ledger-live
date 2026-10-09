import { decodeUnifiedAddress, encodeUnifiedAddress } from "./unifiedAddress";

// The mainnet fixtures of logic/address.test.ts: the encoder is only trusted for
// testnet fixtures if it reproduces these exactly.
const UA_TRANSPARENT_ONLY = "u1fcd2t573p0qtf3sz7dft0rwtcmg5q9cxkr8l4c3reshlugr8pr2l5aeersajvcatx6e";
const UA_ORCHARD_ONLY =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";

describe("test unified address encoder", () => {
  it.each([
    ["transparent-only", UA_TRANSPARENT_ONLY],
    ["orchard-only", UA_ORCHARD_ONLY],
  ])("reproduces the mainnet %s fixture exactly", (_name, fixture) => {
    const receivers = decodeUnifiedAddress("u", fixture);

    expect(receivers).toHaveLength(1);
    expect(encodeUnifiedAddress("u", receivers)).toBe(fixture);
  });
});
