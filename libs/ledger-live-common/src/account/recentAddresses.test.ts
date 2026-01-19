import { RecentAddressesStore, setupRecentAddressesStore, getRecentAddressesStore } from ".";
import { RECENT_ADDRESSES_COUNT_LIMIT } from "./recentAddresses";

describe("RecentAddressesStore", () => {
  const onAddAddressCompleteMock = jest.fn();
  let store: RecentAddressesStore;

  beforeEach(() => {
    onAddAddressCompleteMock.mockClear();
    setupRecentAddressesStore({}, onAddAddressCompleteMock);
    store = getRecentAddressesStore();
  });

  it("should add one address and return this only address", async () => {
    const newAddress = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    await store.addAddress("ethereum", newAddress);
    const addresses = store.getAddresses("ethereum").map(entry => entry.address);
    expect(addresses).toEqual([newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(1);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({
      ethereum: [
        expect.objectContaining({
          address: newAddress,
        }),
      ],
    });
  });

  it("should add a second address and return addresses sorted by insertion", async () => {
    const newAddress = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    await store.addAddress("ethereum", newAddress);
    let addresses = store.getAddresses("ethereum").map(entry => entry.address);
    expect(addresses).toEqual([newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(1);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({
      ethereum: [expect.objectContaining({ address: newAddress })],
    });

    const newAddress2 = "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1";
    await store.addAddress("ethereum", newAddress2);
    addresses = store.getAddresses("ethereum").map(entry => entry.address);
    expect(addresses).toEqual([newAddress2, newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(2);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({
      ethereum: [
        expect.objectContaining({ address: newAddress2 }),
        expect.objectContaining({ address: newAddress }),
      ],
    });
  });

  it("should replace at first place when an address is already saved", async () => {
    const newAddress = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    await store.addAddress("ethereum", newAddress);
    let addresses = store.getAddresses("ethereum").map(entry => entry.address);
    expect(addresses).toEqual([newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(1);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({
      ethereum: [expect.objectContaining({ address: newAddress })],
    });

    const newAddress2 = "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1";
    await store.addAddress("ethereum", newAddress2);
    addresses = store.getAddresses("ethereum").map(entry => entry.address);
    expect(addresses).toEqual([newAddress2, newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(2);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({
      ethereum: [
        expect.objectContaining({ address: newAddress2 }),
        expect.objectContaining({ address: newAddress }),
      ],
    });

    await store.addAddress("ethereum", newAddress);
    addresses = store.getAddresses("ethereum").map(entry => entry.address);
    expect(addresses).toEqual([newAddress, newAddress2]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(3);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({
      ethereum: [
        expect.objectContaining({ address: newAddress }),
        expect.objectContaining({ address: newAddress2 }),
      ],
    });
  });

  it("should replace at first place and remove last element when addresses exceed count limit", async () => {
    const expectedAddresses: string[] = [];
    const expectedObjects: any[] = [];
    for (let index = 0; index < RECENT_ADDRESSES_COUNT_LIMIT; index++) {
      const addr = `0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3${index}`;
      await store.addAddress("ethereum", addr);
      expectedAddresses.unshift(addr);
      expectedObjects.unshift(expect.objectContaining({ address: addr }));
    }

    let addresses = store.getAddresses("ethereum").map(entry => entry.address);
    expect(addresses).toEqual(expectedAddresses);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(RECENT_ADDRESSES_COUNT_LIMIT);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({ ethereum: expectedObjects });

    const newAddress2 = "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1";
    expectedAddresses.splice(expectedAddresses.length - 1, 1);
    expectedAddresses.unshift(newAddress2);

    expectedObjects.splice(expectedObjects.length - 1, 1);
    expectedObjects.unshift(expect.objectContaining({ address: newAddress2 }));

    await store.addAddress("ethereum", newAddress2);
    addresses = store.getAddresses("ethereum").map(entry => entry.address);
    expect(addresses).toEqual(expectedAddresses);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(RECENT_ADDRESSES_COUNT_LIMIT + 1);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({ ethereum: expectedObjects });
  });

  it("should add an address of a different currency", async () => {
    const newAddress = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    await store.addAddress("ethereum", newAddress);

    let addresses = store.getAddresses("ethereum").map(entry => entry.address);
    expect(addresses).toEqual([newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(1);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({
      ethereum: [expect.objectContaining({ address: newAddress })],
    });

    const newAddress2 = "bc1pxlmrudqyq8qd8pfsc4mpmlaw56x6vtcr9m8nvp8kj3gckefc4kmqhkg4l7";
    await store.addAddress("bitcoin", newAddress2);

    addresses = store.getAddresses("bitcoin").map(entry => entry.address);
    expect(addresses).toEqual([newAddress2]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(2);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({
      ethereum: [expect.objectContaining({ address: newAddress })],
      bitcoin: [expect.objectContaining({ address: newAddress2 })],
    });
  });

  it("should update timestamp and move to top when re-adding an existing address", async () => {
    const address1 = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    const address2 = "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1";
    const address3 = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

    const now = Date.now();
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    const threeYearsAgo = now - 3 * oneYear;
    const oneYearAgo = now - oneYear;

    const dateNowSpy = jest.spyOn(Date, "now");

    // Add address1 3 years ago
    dateNowSpy.mockReturnValue(threeYearsAgo);
    await store.addAddress("ethereum", address1);

    // Add address2 1 year ago
    dateNowSpy.mockReturnValue(oneYearAgo);
    await store.addAddress("ethereum", address2);

    // Add address3 now
    dateNowSpy.mockReturnValue(now);
    await store.addAddress("ethereum", address3);

    let addresses = store.getAddresses("ethereum").map(entry => entry.address);
    expect(addresses).toEqual([address3, address2, address1]);

    // Re-add address1 (the oldest one) now
    const reAddTime = now + 1000;
    dateNowSpy.mockReturnValue(reAddTime);
    await store.addAddress("ethereum", address1);

    addresses = store.getAddresses("ethereum").map(entry => entry.address);
    expect(addresses).toEqual([address1, address3, address2]);

    expect(onAddAddressCompleteMock).toHaveBeenLastCalledWith({
      ethereum: [
        expect.objectContaining({ address: address1, lastUsed: reAddTime }),
        expect.objectContaining({ address: address3, lastUsed: now }),
        expect.objectContaining({ address: address2, lastUsed: oneYearAgo }),
      ],
    });
  });

  it("should migrate legacy string addresses to RecentAddress objects on setup", async () => {
    const legacyAddress1 = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    const legacyAddress2 = "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1";
    const modernAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
    const modernTimestamp = 1234567890;
    const modernEnsName = "vitalik.eth";

    const legacyCache: any = {
      ethereum: [
        legacyAddress1,
        { address: modernAddress, lastUsed: modernTimestamp, ensName: modernEnsName },
        legacyAddress2,
      ],
    };

    setupRecentAddressesStore(legacyCache, onAddAddressCompleteMock);
    store = getRecentAddressesStore();

    const addresses = store.getAddresses("ethereum");

    expect(addresses).toHaveLength(3);
    expect(addresses[0]).toMatchObject({
      address: legacyAddress1,
      ensName: undefined,
    });
    expect(addresses[0].lastUsed).toBeDefined();

    expect(addresses[1]).toMatchObject({
      address: modernAddress,
      lastUsed: modernTimestamp,
      ensName: modernEnsName,
    });

    expect(addresses[2]).toMatchObject({
      address: legacyAddress2,
      ensName: undefined,
    });
    expect(addresses[2].lastUsed).toBeDefined();
  });

  it("should save and retrieve ensName when provided", async () => {
    const address = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    const ensName = "vitalik.eth";
    await store.addAddress("ethereum", address, ensName);
    const addresses = store.getAddresses("ethereum");
    expect(addresses).toHaveLength(1);
    expect(addresses[0]).toEqual(
      expect.objectContaining({
        address,
        ensName,
      }),
    );
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({
      ethereum: [expect.objectContaining({ address, ensName })],
    });
  });

  it("should save address without ensName when not provided", async () => {
    const address = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    await store.addAddress("ethereum", address);
    const addresses = store.getAddresses("ethereum");
    expect(addresses).toHaveLength(1);
    expect(addresses[0]).toEqual(
      expect.objectContaining({
        address,
        ensName: undefined,
      }),
    );
  });

  it("should handle corrupted nested address structure with index", async () => {
    const address1 = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    const timestamp1 = 1768235334651;

    const corruptedCache: any = {
      ethereum: [
        {
          address: {
            address: address1,
            lastUsed: timestamp1,
          },
          index: 0,
        },
      ],
    };

    setupRecentAddressesStore(corruptedCache, onAddAddressCompleteMock);
    store = getRecentAddressesStore();

    const addresses = store.getAddresses("ethereum");

    expect(addresses).toHaveLength(1);
    expect(addresses[0]).toMatchObject({
      address: address1,
      lastUsed: timestamp1,
      ensName: undefined,
    });
  });

  it("should handle corrupted nested address structure without timestamp", async () => {
    const address1 = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";

    const corruptedCache: any = {
      ethereum: [
        {
          address: {
            address: address1,
          },
          index: 5,
        },
      ],
    };

    setupRecentAddressesStore(corruptedCache, onAddAddressCompleteMock);
    store = getRecentAddressesStore();

    const addresses = store.getAddresses("ethereum");

    expect(addresses).toHaveLength(1);
    expect(addresses[0]).toMatchObject({
      address: address1,
      ensName: undefined,
    });
    expect(addresses[0].lastUsed).toBeDefined();
  });

  it("should handle corrupted nested address structure with ensName", async () => {
    const address1 = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    const timestamp1 = 1768235334651;
    const ensName = "example.eth";

    const corruptedCache: any = {
      ethereum: [
        {
          address: {
            address: address1,
            lastUsed: timestamp1,
            ensName,
          },
        },
      ],
    };

    setupRecentAddressesStore(corruptedCache, onAddAddressCompleteMock);
    store = getRecentAddressesStore();

    const addresses = store.getAddresses("ethereum");

    expect(addresses).toHaveLength(1);
    expect(addresses[0]).toMatchObject({
      address: address1,
      lastUsed: timestamp1,
      ensName,
    });
  });

  it("should handle multiple corrupted formats in same cache", async () => {
    const legacyString = "0x1111111111111111111111111111111111111111";
    const validAddress = "0x2222222222222222222222222222222222222222";
    const corruptedAddress1 = "0x3333333333333333333333333333333333333333";
    const corruptedAddress2 = "0x4444444444444444444444444444444444444444";

    const mixedCache: any = {
      ethereum: [
        legacyString,
        { address: validAddress, lastUsed: 1000000, ensName: "valid.eth" },
        {
          address: {
            address: corruptedAddress1,
            lastUsed: 2000000,
          },
          index: 0,
        },
        {
          address: {
            address: corruptedAddress2,
            ensName: "corrupted.eth",
          },
        },
      ],
    };

    setupRecentAddressesStore(mixedCache, onAddAddressCompleteMock);
    store = getRecentAddressesStore();

    const addresses = store.getAddresses("ethereum");

    expect(addresses).toHaveLength(4);
    expect(addresses[0]).toMatchObject({ address: legacyString, ensName: undefined });
    expect(addresses[1]).toMatchObject({
      address: validAddress,
      lastUsed: 1000000,
      ensName: "valid.eth",
    });
    expect(addresses[2]).toMatchObject({
      address: corruptedAddress1,
      lastUsed: 2000000,
      ensName: undefined,
    });
    expect(addresses[3]).toMatchObject({
      address: corruptedAddress2,
      ensName: "corrupted.eth",
    });
    expect(addresses[3].lastUsed).toBeDefined();
  });

  it("should filter out invalid entries", async () => {
    const validAddress = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    const corruptedAddress = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E4CORRUPTED";

    const mixedCache: any = {
      ethereum: [
        { address: validAddress, lastUsed: Date.now() },
        {
          address: {
            address: corruptedAddress,
            lastUsed: 1768235334651,
          },
        },
        null,
        undefined,
        { address: "", lastUsed: Date.now() },
        { invalidKey: "value" },
        { address: null },
        { lastUsed: 123456789 },
        {},
        [],
        42,
        true,
        false,
      ],
    };

    setupRecentAddressesStore(mixedCache, onAddAddressCompleteMock);
    store = getRecentAddressesStore();

    const addresses = store.getAddresses("ethereum");

    expect(addresses).toHaveLength(2);
    expect(addresses[0]).toMatchObject({ address: validAddress });
    expect(addresses[1]).toMatchObject({
      address: corruptedAddress,
      lastUsed: 1768235334651,
    });
  });

  it("should handle empty arrays and undefined currencies", async () => {
    const cache: any = {
      ethereum: [],
      bitcoin: undefined,
      polygon: null,
    };

    setupRecentAddressesStore(cache, onAddAddressCompleteMock);
    store = getRecentAddressesStore();

    expect(store.getAddresses("ethereum")).toEqual([]);
    expect(store.getAddresses("bitcoin")).toEqual([]);
    expect(store.getAddresses("polygon")).toEqual([]);
    expect(store.getAddresses("nonexistent")).toEqual([]);
  });

  it("should sanitize deeply nested corrupted structures", async () => {
    const address1 = "0x1111111111111111111111111111111111111111";

    const deeplyCorruptedCache: any = {
      ethereum: [
        {
          address: {
            address: {
              address: address1,
            },
          },
        },
      ],
    };

    setupRecentAddressesStore(deeplyCorruptedCache, onAddAddressCompleteMock);
    store = getRecentAddressesStore();

    const addresses = store.getAddresses("ethereum");

    // Should filter out invalid deeply nested structure
    expect(addresses).toHaveLength(0);
  });

  it("should preserve order when sanitizing mixed formats", async () => {
    const addr1 = "0x1111111111111111111111111111111111111111";
    const addr2 = "0x2222222222222222222222222222222222222222";
    const addr3 = "0x3333333333333333333333333333333333333333";
    const addr4 = "0x4444444444444444444444444444444444444444";

    const cache: any = {
      ethereum: [
        addr1,
        {
          address: {
            address: addr2,
            lastUsed: 2000,
          },
        },
        { address: addr3, lastUsed: 3000, ensName: "three.eth" },
        {
          address: {
            address: addr4,
            lastUsed: 4000,
            ensName: "four.eth",
          },
          index: 3,
        },
      ],
    };

    setupRecentAddressesStore(cache, onAddAddressCompleteMock);
    store = getRecentAddressesStore();

    const addresses = store.getAddresses("ethereum");

    expect(addresses).toHaveLength(4);
    expect(addresses.map(a => a.address)).toEqual([addr1, addr2, addr3, addr4]);
    expect(addresses[0]).toMatchObject({ address: addr1, ensName: undefined });
    expect(addresses[1]).toMatchObject({ address: addr2, lastUsed: 2000, ensName: undefined });
    expect(addresses[2]).toMatchObject({ address: addr3, lastUsed: 3000, ensName: "three.eth" });
    expect(addresses[3]).toMatchObject({ address: addr4, lastUsed: 4000, ensName: "four.eth" });
  });
});
