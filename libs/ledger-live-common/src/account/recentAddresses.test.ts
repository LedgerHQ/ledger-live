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
    const addresses = store.getAddresses("ethereum");
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
    let addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual([newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(1);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({
      ethereum: [expect.objectContaining({ address: newAddress })],
    });

    const newAddress2 = "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1";
    await store.addAddress("ethereum", newAddress2);
    addresses = store.getAddresses("ethereum");
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
    let addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual([newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(1);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({
      ethereum: [expect.objectContaining({ address: newAddress })],
    });

    const newAddress2 = "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1";
    await store.addAddress("ethereum", newAddress2);
    addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual([newAddress2, newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(2);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({
      ethereum: [
        expect.objectContaining({ address: newAddress2 }),
        expect.objectContaining({ address: newAddress }),
      ],
    });

    await store.addAddress("ethereum", newAddress);
    addresses = store.getAddresses("ethereum");
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

    let addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual(expectedAddresses);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(RECENT_ADDRESSES_COUNT_LIMIT);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({ ethereum: expectedObjects });

    const newAddress2 = "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1";
    expectedAddresses.splice(expectedAddresses.length - 1, 1);
    expectedAddresses.unshift(newAddress2);

    expectedObjects.splice(expectedObjects.length - 1, 1);
    expectedObjects.unshift(expect.objectContaining({ address: newAddress2 }));

    await store.addAddress("ethereum", newAddress2);
    addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual(expectedAddresses);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(RECENT_ADDRESSES_COUNT_LIMIT + 1);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({ ethereum: expectedObjects });
  });

  it("should add an address of a different currency", async () => {
    const newAddress = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    await store.addAddress("ethereum", newAddress);

    let addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual([newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(1);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({
      ethereum: [expect.objectContaining({ address: newAddress })],
    });

    const newAddress2 = "bc1pxlmrudqyq8qd8pfsc4mpmlaw56x6vtcr9m8nvp8kj3gckefc4kmqhkg4l7";
    await store.addAddress("bitcoin", newAddress2);

    addresses = store.getAddresses("bitcoin");
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

    let addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual([address3, address2, address1]);

    // Re-add address1 (the oldest one) now
    const reAddTime = now + 1000;
    dateNowSpy.mockReturnValue(reAddTime);
    await store.addAddress("ethereum", address1);

    addresses = store.getAddresses("ethereum");
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

    const legacyCache: any = {
      ethereum: [
        legacyAddress1,
        { address: modernAddress, lastUsed: modernTimestamp },
        legacyAddress2,
      ],
    };

    setupRecentAddressesStore(legacyCache, onAddAddressCompleteMock);
    store = getRecentAddressesStore();

    const addresses = store.getAddresses("ethereum");

    // Order should be preserved: legacy1, modern, legacy2
    expect(addresses).toEqual([legacyAddress1, modernAddress, legacyAddress2]);
  });
});
