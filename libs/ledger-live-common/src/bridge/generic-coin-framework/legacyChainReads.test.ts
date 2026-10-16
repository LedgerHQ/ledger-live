import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import BigNumber from "bignumber.js";
import { getCoinModuleApi } from "./api";
import { getBridgeApi } from "./bridge";
import { coinModuleChainReads, legacyChainReadsFor } from "./legacyChainReads";

jest.mock("./api", () => ({ getCoinModuleApi: jest.fn() }));
jest.mock("./bridge", () => ({ getBridgeApi: jest.fn() }));

const context = { config: jest.fn(), logger: jest.fn() };

describe("coinModuleChainReads", () => {
  it("reads the coin module, with its context", async () => {
    const info = { type: "tron", resources: { energy: new BigNumber("1e21") }, at: new Date(0) };
    const transaction = { hash: "0xh", block: null };
    const api = {
      getAccountInfo: jest.fn(async () => info),
      call: jest.fn(async () => "0xresult"),
      getNextSequence: jest.fn(async () => 7n),
      getAddressesForPublicKey: jest.fn(async () => ["0.0.1"]),
      getTransactionInfo: jest.fn(async () => transaction),
      supports: jest.fn(() => true),
    };

    const chain = coinModuleChainReads(api as never, context as never);

    // The JSON form, as the portfolio path answers it.
    await expect(chain.getAccountInfo("addr")).resolves.toEqual({
      type: "tron",
      resources: { energy: "1000000000000000000000" },
      at: "1970-01-01T00:00:00.000Z",
    });
    await expect(chain.call({ to: "0x1" })).resolves.toBe("0xresult");
    await expect(chain.getNextSequence("addr")).resolves.toBe(7n);
    await expect(chain.getAddressesForPublicKey("pub")).resolves.toEqual(["0.0.1"]);
    await expect(chain.getTransactionInfo("0xh")).resolves.toBe(transaction);
    expect(api.getAccountInfo).toHaveBeenCalledWith(context, "addr");
    expect(api.call).toHaveBeenCalledWith(context, { to: "0x1" });
    expect(api.getNextSequence).toHaveBeenCalledWith(context, "addr");
    expect(api.getAddressesForPublicKey).toHaveBeenCalledWith(context, "pub");
    expect(api.getTransactionInfo).toHaveBeenCalledWith(context, "0xh");
    expect(api.supports).toHaveBeenCalledWith("call");
  });

  it("reads the account metadata once per address", async () => {
    const api = {
      getAccountInfo: jest.fn(async (_c: unknown, address: string) => ({ type: address })),
    };
    const chain = coinModuleChainReads(api as never, context as never);

    await Promise.all([chain.getAccountInfo("a"), chain.getAccountInfo("a")]);
    await expect(chain.getAccountInfo("b")).resolves.toEqual({ type: "b" });
    expect(api.getAccountInfo).toHaveBeenCalledTimes(2);
  });

  it("answers ADR-045's none for a module reporting no account metadata", async () => {
    await expect(
      coinModuleChainReads({} as never, context as never).getAccountInfo("a"),
    ).resolves.toEqual({ type: "none" });
    await expect(
      coinModuleChainReads(
        { getAccountInfo: async () => undefined } as never,
        context as never,
      ).getAccountInfo("a"),
    ).resolves.toEqual({ type: "none" });
  });

  it("rejects with ChainReadUnsupportedError a read the module lacks", async () => {
    const chain = coinModuleChainReads({} as never, context as never);

    await expect(chain.call({})).rejects.toThrow(ChainReadUnsupportedError);
    await expect(chain.getNextSequence("a")).rejects.toThrow(
      "getNextSequence is not supported by the coin module",
    );
    await expect(chain.getAddressesForPublicKey("k")).rejects.toThrow(ChainReadUnsupportedError);
    await expect(chain.getTransactionInfo("h")).rejects.toThrow(ChainReadUnsupportedError);
  });

  it("rejects a capability the module does not support, and serves its extra members when present", async () => {
    const stub = jest.fn();
    const supports = jest.fn((_name: string) => false);
    const chain = coinModuleChainReads(
      {
        call: stub,
        getNextSequence: stub,
        getAddressesForPublicKey: jest.fn(async () => ["0.0.1"]),
        getTransactionInfo: jest.fn(async () => undefined),
        supports,
      } as never,
      context as never,
    );

    await expect(chain.call({})).rejects.toThrow(ChainReadUnsupportedError);
    await expect(chain.getNextSequence("a")).rejects.toThrow(ChainReadUnsupportedError);
    expect(stub).not.toHaveBeenCalled();
    // `withDefaults`' supports() knows the contract's capabilities only.
    await expect(chain.getAddressesForPublicKey("k")).resolves.toEqual(["0.0.1"]);
    await expect(chain.getTransactionInfo("h")).resolves.toBeUndefined();
    expect(supports.mock.calls.map(([name]) => name)).toEqual(["call", "getNextSequence"]);
  });

  it("propagates the module's own failure", async () => {
    const down = new Error("node down");
    const chain = coinModuleChainReads(
      { getNextSequence: jest.fn(async () => Promise.reject(down)) } as never,
      context as never,
    );

    await expect(chain.getNextSequence("a")).rejects.toBe(down);
  });

  it("takes the family's legacy reads over the coin module's, in the JSON form", async () => {
    const api = {
      getAccountInfo: jest.fn(async () => ({ type: "none" })),
      getTransactionInfo: jest.fn(),
    };
    const legacy = {
      getAccountInfo: jest.fn(async () => ({
        type: "none",
        redelegations: [{ amount: new BigNumber(5), completionDate: new Date(0) }],
      })),
      getTransactionInfo: jest.fn(async () => undefined),
    };

    const chain = coinModuleChainReads(api as never, context as never, legacy);

    await expect(chain.getAccountInfo("a")).resolves.toEqual({
      type: "none",
      redelegations: [{ amount: "5", completionDate: "1970-01-01T00:00:00.000Z" }],
    });
    await expect(chain.getTransactionInfo("h")).resolves.toBeUndefined();
    expect(api.getAccountInfo).not.toHaveBeenCalled();
    expect(api.getTransactionInfo).not.toHaveBeenCalled();
  });
});

describe("legacyChainReadsFor", () => {
  const evm = getCryptoCurrencyById("ethereum");

  it("reads the currency's coin module, with the family's legacy reads", async () => {
    const api = { getNextSequence: jest.fn(async () => 3n) };
    const getTransactionInfo = jest.fn(async () => undefined);
    const legacyChainReads = jest.fn(() => ({ getTransactionInfo }));
    jest.mocked(getCoinModuleApi).mockResolvedValue(api as never);
    jest.mocked(getBridgeApi).mockResolvedValue({ legacyChainReads });

    const chain = await legacyChainReadsFor(evm);

    expect(getCoinModuleApi).toHaveBeenCalledWith("ethereum", "local");
    expect(getBridgeApi).toHaveBeenCalledWith(evm, "evm");
    expect(legacyChainReads).toHaveBeenCalledWith(
      evm,
      api,
      expect.objectContaining({ config: expect.any(Function) }),
    );
    await expect(chain.getNextSequence("a")).resolves.toBe(3n);
    await expect(chain.getTransactionInfo("h")).resolves.toBeUndefined();
    expect(getTransactionInfo).toHaveBeenCalledWith("h");
  });

  it("reads the coin module alone for a family without legacy reads", async () => {
    jest.mocked(getCoinModuleApi).mockResolvedValue({} as never);
    jest.mocked(getBridgeApi).mockResolvedValue({});

    const chain = await legacyChainReadsFor(evm);

    await expect(chain.getTransactionInfo("h")).rejects.toThrow(ChainReadUnsupportedError);
  });
});
