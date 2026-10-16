import type { BridgeApi, ChainReads } from "@ledgerhq/ledger-wallet-framework/api/types";
import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { log } from "@ledgerhq/logs";
import { readFamilyData } from "./familyReads";

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

const currency = getCryptoCurrencyById("tron");
const ADDRESS = "TAddress";
const INFO = { type: "tron", activated: true };

const chainReads = (getAccountInfo = jest.fn(async () => INFO)): ChainReads => ({
  getAccountInfo,
  call: jest.fn(),
  getNextSequence: jest.fn(),
  getAddressesForPublicKey: jest.fn(),
  getTransactionInfo: jest.fn(),
});

describe("readFamilyData", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reads nothing, not even the account metadata, for a family without hooks", async () => {
    const chain = chainReads();

    await expect(readFamilyData({}, chain, currency, ADDRESS)).resolves.toEqual({});
    expect(chain.getAccountInfo).not.toHaveBeenCalled();
  });

  it("reads the account metadata once for both mappers, and the readiness through the chain", async () => {
    const chain = chainReads();
    const bridgeApi: Partial<BridgeApi> = {
      buildAccountShape: jest.fn(async () => ({ tronResources: "resources" })),
      buildTokenAccountShapes: jest.fn(() => ({ mint: { state: "frozen" } })),
      getAccountReadiness: jest.fn(async () => ({ ready: true })),
    };

    await expect(readFamilyData(bridgeApi, chain, currency, ADDRESS)).resolves.toEqual({
      familyShape: { tronResources: "resources" },
      tokenShapes: { mint: { state: "frozen" } },
      readiness: { ready: true },
    });
    expect(chain.getAccountInfo).toHaveBeenCalledTimes(1);
    expect(chain.getAccountInfo).toHaveBeenCalledWith(ADDRESS);
    expect(bridgeApi.buildAccountShape).toHaveBeenCalledWith(ADDRESS, INFO);
    expect(bridgeApi.buildTokenAccountShapes).toHaveBeenCalledWith(ADDRESS, INFO);
    expect(bridgeApi.getAccountReadiness).toHaveBeenCalledWith(currency, ADDRESS, chain);
  });

  it("calls the hooks on the bridge that declares them", async () => {
    const bridgeApi = {
      fields: { familyField: 1 },
      buildAccountShape(this: { fields: object }) {
        return this.fields;
      },
    } as unknown as Partial<BridgeApi>;

    await expect(readFamilyData(bridgeApi, chainReads(), currency, ADDRESS)).resolves.toEqual({
      familyShape: { familyField: 1 },
    });
  });

  it("leaves out what the hooks contribute nothing to", async () => {
    const bridgeApi: Partial<BridgeApi> = {
      buildAccountShape: jest.fn(() => undefined),
      buildTokenAccountShapes: jest.fn(() => undefined as never),
    };

    await expect(readFamilyData(bridgeApi, chainReads(), currency, ADDRESS)).resolves.toEqual({});
  });

  it("fails when the metadata read or the mapper fails: the family's fields may be load-bearing", async () => {
    const down = new Error("node down");
    await expect(
      readFamilyData(
        { buildAccountShape: jest.fn() },
        chainReads(jest.fn(async () => Promise.reject(down))),
        currency,
        ADDRESS,
      ),
    ).rejects.toBe(down);

    const mapperFailure = new Error("mapper");
    await expect(
      readFamilyData(
        {
          buildAccountShape: jest.fn(async () => {
            throw mapperFailure;
          }),
        },
        chainReads(),
        currency,
        ADDRESS,
      ),
    ).rejects.toBe(mapperFailure);
  });

  it("skips the mapper and keeps the stored fields when the path cannot serve the read", async () => {
    const buildAccountShape = jest.fn();
    const unsupported = new ChainReadUnsupportedError("getAccountInfo is not served");

    await expect(
      readFamilyData(
        { buildAccountShape },
        chainReads(jest.fn(async () => Promise.reject(unsupported))),
        currency,
        ADDRESS,
      ),
    ).resolves.toEqual({});
    expect(buildAccountShape).not.toHaveBeenCalled();
  });

  it("hands the token mapper no metadata when the read fails", async () => {
    const buildTokenAccountShapes = jest.fn(() => ({}));

    for (const failure of [new Error("rpc down"), "rpc down"]) {
      await expect(
        readFamilyData(
          { buildTokenAccountShapes },
          chainReads(jest.fn(async () => Promise.reject(failure))),
          currency,
          ADDRESS,
        ),
      ).resolves.toEqual({ tokenShapes: {} });
      expect(buildTokenAccountShapes).toHaveBeenLastCalledWith(ADDRESS, undefined);
      expect(log).toHaveBeenLastCalledWith(
        "generic-coin-framework",
        "getAccountInfo failed, token accounts get no metadata",
        { error: "rpc down" },
      );
    }
  });

  it("leaves the readiness undefined when its lookup fails", async () => {
    const getAccountReadiness = jest.fn(async () => {
      throw new ChainReadUnsupportedError("call is not served");
    });

    await expect(
      readFamilyData({ getAccountReadiness }, chainReads(), currency, ADDRESS),
    ).resolves.toEqual({});
    expect(log).toHaveBeenCalledWith(
      "generic-coin-framework",
      "getAccountReadiness failed, leaving readiness undefined",
      { error: "call is not served" },
    );
  });

  describe("sequence", () => {
    it("reads the next sequence of a family that stores it, as a number", async () => {
      const chain = chainReads();
      jest.mocked(chain.getNextSequence).mockResolvedValue(17n);

      await expect(
        readFamilyData({ accountSequenceSupported: true }, chain, currency, ADDRESS),
      ).resolves.toEqual({ sequence: 17 });
      expect(chain.getNextSequence).toHaveBeenCalledWith(ADDRESS);

      await expect(readFamilyData({}, chain, currency, ADDRESS)).resolves.toEqual({});
      expect(chain.getNextSequence).toHaveBeenCalledTimes(1);
    });

    it("keeps the stored sequence when the path cannot serve the read, and fails otherwise", async () => {
      const chain = chainReads();
      const bridgeApi = { accountSequenceSupported: true };
      jest
        .mocked(chain.getNextSequence)
        .mockRejectedValueOnce(new ChainReadUnsupportedError("not served"))
        .mockRejectedValueOnce(new Error("node down"));

      await expect(readFamilyData(bridgeApi, chain, currency, ADDRESS)).resolves.toEqual({});
      await expect(readFamilyData(bridgeApi, chain, currency, ADDRESS)).rejects.toThrow(
        "node down",
      );
    });
  });
});
