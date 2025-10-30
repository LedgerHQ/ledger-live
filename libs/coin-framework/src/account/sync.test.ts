import { CryptoAssetsStore } from "@ledgerhq/types-live";
import { getCryptoAssetsStore } from "../crypto-assets";
import { getSyncHash } from "./sync";

jest.mock("../crypto-assets");

const mockedGetTokensSyncHash = jest.fn();
jest.mocked(getCryptoAssetsStore).mockImplementation(
  () =>
    ({
      getTokensSyncHash: (currencyId: string) => mockedGetTokensSyncHash(currencyId),
    }) as unknown as CryptoAssetsStore,
);

describe("getSyncHash", () => {
  beforeEach(() => {
    mockedGetTokensSyncHash.mockClear();
    mockedGetTokensSyncHash.mockImplementation(currencyId => `some_random_hash_for_${currencyId}`);
  });

  it("should return the same hash when there is no blacklist token ids", async () => {
    const hash = await getSyncHash("cardano");
    expect(hash).toMatch(/^0x[a-f0-9]{7,8}$/);

    const hash2 = await getSyncHash("cardano", undefined);
    expect(hash2).toEqual(hash);

    const hash3 = await getSyncHash("cardano", []);
    expect(hash3).toEqual(hash);
  });

  it("should return the same hash nevermind the order of the blacklist token ids", async () => {
    const hash = await getSyncHash("cardano", [
      "some_random_id",
      "some_random_id_2",
      "some_random_id_3",
    ]);
    expect(hash).toMatch(/^0x[a-f0-9]{7,8}$/);

    const hash2 = await getSyncHash("cardano", [
      "some_random_id",
      "some_random_id_3",
      "some_random_id_2",
    ]);
    expect(hash2).toEqual(hash);

    const hash3 = await getSyncHash("cardano", [
      "some_random_id_2",
      "some_random_id_3",
      "some_random_id",
    ]);
    expect(hash3).toEqual(hash);
  });

  it("should not return the same hash when tokens sync hash from store change", async () => {
    mockedGetTokensSyncHash.mockClear();
    mockedGetTokensSyncHash.mockImplementationOnce(
      currencyId => `some_random_hash_for_${currencyId}`,
    );

    const hash = await getSyncHash("cardano", ["some_random_id", "some_random_id_2"]);
    expect(hash).toMatch(/^0x[a-f0-9]{7,8}$/);

    mockedGetTokensSyncHash.mockClear();
    mockedGetTokensSyncHash.mockImplementation(
      currencyId => `some_random_hash_for_${currencyId}_2`,
    );
    const hash2 = await getSyncHash("cardano", ["some_random_id", "some_random_id_2"]);
    expect(hash2).toMatch(/^0x[a-f0-9]{7,8}$/);

    expect(hash2).not.toEqual(hash);

    const hash3 = await getSyncHash("cardano", ["some_random_id_2", "some_random_id"]);
    expect(hash3).toMatch(/^0x[a-f0-9]{7,8}$/);

    expect(hash3).not.toEqual(hash);
    expect(hash3).toEqual(hash2);
  });
});
