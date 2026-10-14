import { register } from "./registrations";
import { aLocalNetwork, sequentialIds } from "./test-utils";
import type { LocalNetwork } from "./types";

const ethereum = aLocalNetwork({
  currencyId: "ethereum",
  derivationMode: "",
  derivationPath: "44'/60'/0'",
  registrationTypes: ["static", "evm"],
});
const polygon = aLocalNetwork({
  currencyId: "polygon",
  derivationMode: "",
  derivationPath: "44'/60'/0'",
  registrationTypes: ["evm"],
});
const solana = aLocalNetwork({
  currencyId: "solana",
  derivationMode: "solanaMain",
  derivationPath: "44'/501'/0'",
  registrationTypes: ["solana"],
});
const networks = { bitcoin: aLocalNetwork(), ethereum, polygon, solana };

const depsWith = (served: Record<string, LocalNetwork> = networks) => ({
  networks: served,
  generateId: sequentialIds(),
});

const keysOf = (accounts: Array<{ id: string; network: string; descriptor?: { key: string } }>) =>
  accounts.map(({ id, network, descriptor }) => ({ id, network, key: descriptor?.key }));

describe("register", () => {
  it("maps an auto_derive registration to one account keyed by its xpub", () => {
    const input = { type: "auto_derive" as const, network: "bitcoin", xpub: "xpub" };

    expect(register(depsWith(), input)).toEqual({
      registration: { ...input, id: "id-1" },
      accounts: [
        {
          id: "js:2:bitcoin:xpub:native_segwit",
          network: "bitcoin",
          registrationId: "id-1",
          status: "uninitialized",
          descriptor: {
            currencyId: "bitcoin",
            derivationMode: "native_segwit",
            index: 0,
            key: "xpub",
            derivationPath: "84'/0'/0'",
          },
        },
      ],
    });
  });

  it("records an auto_derive registration on a network not served locally as a failed account", () => {
    const input = { type: "auto_derive" as const, network: "litecoin", xpub: "xpub" };

    expect(register(depsWith(), input).accounts).toEqual([
      {
        id: "id-2",
        network: "litecoin",
        registrationId: "id-1",
        status: "registration_failure",
        error: "auto_derive registrations are not served locally on litecoin",
      },
    ]);
  });

  it("maps an evm registration to one account per network accepting evm", () => {
    const { registration, accounts } = register(depsWith(), { type: "evm", address: "0xabc" });

    expect(registration).toEqual({ type: "evm", id: "id-1", address: "0xabc" });
    expect(keysOf(accounts)).toEqual([
      { id: "js:2:ethereum:0xabc:", network: "ethereum", key: "0xabc" },
      { id: "js:2:polygon:0xabc:", network: "polygon", key: "0xabc" },
    ]);
  });

  it("records an evm registration without any network to serve it, with no account", () => {
    const { registration, accounts } = register(depsWith({ solana }), {
      type: "evm",
      address: "0xabc",
    });

    expect(registration).toEqual({ type: "evm", id: "id-1", address: "0xabc" });
    expect(accounts).toEqual([]);
  });

  it("maps a solana registration to an account on the solana network", () => {
    const { accounts } = register(depsWith(), { type: "solana", address: "sol" });

    expect(keysOf(accounts)).toEqual([
      { id: "js:2:solana:sol:solanaMain", network: "solana", key: "sol" },
    ]);
  });

  it("records a solana registration with no solana network served, with no account", () => {
    expect(register(depsWith({ ethereum }), { type: "solana", address: "sol" }).accounts).toEqual(
      [],
    );
  });

  it("maps a static registration of one address to its account, keyed by the address", () => {
    const { registration, accounts } = register(depsWith(), {
      type: "static",
      accountId: "my-account",
      network: "ethereum",
      addresses: ["0xa", "0xa"],
    });

    expect(registration).toEqual({
      type: "static",
      id: "id-1",
      network: "ethereum",
      addresses: ["0xa", "0xa"],
    });
    expect(accounts).toEqual([
      expect.objectContaining({ id: "my-account", status: "uninitialized" }),
    ]);
    expect(keysOf(accounts)).toEqual([{ id: "my-account", network: "ethereum", key: "0xa" }]);
  });

  it.each([
    [[], 0],
    [undefined, 0],
    [["0xa", "0xb"], 2],
  ])("records a static registration of addresses %p as a failed account", (addresses, count) => {
    const { accounts } = register(depsWith(), {
      type: "static",
      accountId: "my-account",
      network: "ethereum",
      ...(addresses ? { addresses } : {}),
    });

    expect(accounts).toEqual([
      {
        id: "my-account",
        network: "ethereum",
        registrationId: "id-1",
        status: "registration_failure",
        error: `A static account is served locally for exactly one address, not ${count}`,
      },
    ]);
  });

  it("records a static registration on a network not serving it as a failed account", () => {
    const { accounts } = register(depsWith(), {
      type: "static",
      accountId: "my-account",
      network: "bitcoin",
      addresses: ["bc1"],
    });

    expect(accounts).toEqual([
      expect.objectContaining({
        id: "my-account",
        status: "registration_failure",
        error: "static registrations are not served locally on bitcoin",
      }),
    ]);
  });

  it("records a cardano registration as a failed account", () => {
    const { registration, accounts } = register(depsWith(), {
      type: "cardano",
      accountId: "ada",
      network: "cardano",
      external: ["addr1"],
    });

    expect(registration).toEqual({
      type: "cardano",
      id: "id-1",
      network: "cardano",
      external: ["addr1"],
    });
    expect(accounts).toEqual([
      expect.objectContaining({
        id: "ada",
        status: "registration_failure",
        error: "cardano registrations are not served locally on cardano",
      }),
    ]);
  });
});
