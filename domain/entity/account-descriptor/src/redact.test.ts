import { redactAccountDescriptors } from "./redact";
import { ETH_ADDR, XPUB } from "./test-fixtures";

const UTXO = `account:2:utxo:bitcoin:${XPUB}:m/84h/0h/0h`;
const ADDRESS = `mock:2:address:ethereum:${ETH_ADDR}:m/44h/60h/0h/0/0`;

describe("redactAccountDescriptors", () => {
  it("redacts every descriptor of a text", () => {
    const text = `Failed to read ${UTXO} then ${ADDRESS}.`;
    expect(redactAccountDescriptors(text)).toBe("Failed to read [redacted] then [redacted].");
  });

  it("redacts a descriptor in JSON and in a URL", () => {
    const json = JSON.stringify({ descriptor: UTXO });
    expect(redactAccountDescriptors(json)).toBe('{"descriptor":"[redacted]"}');
    const url = `https://x.test/?d=${encodeURIComponent(ADDRESS)}&n=1`;
    expect(redactAccountDescriptors(url)).toBe("https://x.test/?d=[redacted]&n=1");
  });

  it("redacts a key that holds a colon", () => {
    expect(redactAccountDescriptors("account:2:address:hedera:0.0:1:m/44h/3030h/0h/0h/0h")).toBe(
      "[redacted]",
    );
  });

  it("leaves other text alone", () => {
    const text = "account 2 of utxo; js:2:ethereum:0xabc: legacy ids are another matter";
    expect(redactAccountDescriptors(text)).toBe(text);
  });
});
