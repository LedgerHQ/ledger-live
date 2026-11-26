import { AccountDescriptorSchema } from "./schema";
import { parseAccountDescriptor } from "./serialization";
import { ETH_ADDR, XPUB } from "./test-fixtures";

const XPRV = XPUB.replace(/^xpub/, "xprv");

const INVALID = [
  `account:2:utxo:bitcoin:${XPUB}:m/84h/0h/0`,
  `account:2:utxo:bitcoin:${XPRV}:m/84h/0h/0h`,
  `account:2:utxo:bit coin:${XPUB}:m/84h/0h/0h`,
  `account:2:address:ethereum:${ETH_ADDR}:m/44h/60h/0h/0/01`,
  `account:2:address:ethereum:${ETH_ADDR}:m/44h/60h/0h/0/2147483648`,
  `account:2:address:ethereum:${ETH_ADDR} x:m/44h/60h/0h/0/0`,
  `account:2:script:ethereum:${ETH_ADDR}:m/44h/60h/0h/0/0`,
  `account:3:address:ethereum:${ETH_ADDR}:m/44h/60h/0h/0/0`,
  `wallet:2:address:ethereum:${ETH_ADDR}:m/44h/60h/0h/0/0`,
  `account:2:address:ethereum:${ETH_ADDR}`,
  `account:2:address:ethereum::m/44h/60h/0h/0/0`,
];

const thrown = (run: () => unknown): Error => {
  try {
    run();
  } catch (error) {
    if (error instanceof Error) return error;
  }
  throw new Error("expected a throw");
};

describe("errors of the descriptor package", () => {
  it.each(INVALID)("never hold the parsed input: %#", input => {
    const error = thrown(() => parseAccountDescriptor(input));
    const text = `${error.message}\n${error.stack ?? ""}`;
    expect(text).not.toContain(XPUB.slice(4, 20));
    expect(text).not.toContain(ETH_ADDR.slice(2, 20));
    expect(text).not.toContain(input);
  });

  it("never hold the key of an invalid descriptor object", () => {
    const error = thrown(() =>
      AccountDescriptorSchema.parse({
        purpose: "account",
        version: "2",
        type: "utxo",
        network: "bitcoin",
        key: XPRV,
        path: "m/84h",
      }),
    );
    expect(error.message).not.toContain(XPRV.slice(4, 20));
  });
});
