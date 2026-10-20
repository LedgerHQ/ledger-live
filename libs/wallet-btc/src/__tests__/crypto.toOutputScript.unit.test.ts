import cryptoFactory from "../crypto/factory";
import { InvalidAddress } from "../errors";

const P2PKH = /^76a914[0-9a-f]{40}88ac$/;
const P2SH = /^a914[0-9a-f]{40}87$/;

describe("toOutputScript", () => {
  it.each([
    ["litecoin", "LLVLXPBzLTHYjF5Q4r6iCEEztCmWecazwP", P2PKH],
    ["dogecoin", "D8cMCRimfjwQ9E8jJvgUswt18WnZbCUAaW", P2PKH],
    ["bitcoin_cash", "bitcoincash:qp2ujnlxjmkwtc299zwat3vt7j0jgltwls3q5avzsj", P2PKH],
    ["decred", "Dsa3RV8eTYqQAp3UavCTJhMvCPzBERydcfe", P2PKH],
    ["decred", "Dcck4QrFF5wuLzQpwxb5evhSRD7ZTsJZwuh", P2SH],
  ] as const)("returns a Buffer script for a %s address", (currency, address, expected) => {
    const script = cryptoFactory(currency).toOutputScript(address);
    expect(Buffer.isBuffer(script)).toBe(true);
    expect(script.toString("hex")).toMatch(expected);
  });

  it("throws InvalidAddress on a malformed decred address", () => {
    expect(() =>
      cryptoFactory("decred").toOutputScript("Dcck4QrFF5wuLQzpwxb5evhSRD7ZTsJZwuh"),
    ).toThrow(InvalidAddress);
  });
});
