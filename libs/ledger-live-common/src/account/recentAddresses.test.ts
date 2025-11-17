import { RecentAddressesStore, RecentAddressesStoreImpl } from ".";
import { RECENT_ADDRESSES_COUNT_LIMIT } from "./recentAddresses";

describe("RecentAddressesStore", () => {
  const onAddAddressCompleteMock = jest.fn();
  let store: RecentAddressesStore;

  beforeEach(() => {
    onAddAddressCompleteMock.mockClear();
    store = new RecentAddressesStoreImpl({}, onAddAddressCompleteMock);
  });

  it("should add one address and return this only address", async () => {
    const newAddress = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    await store.addAddress("ethereum", newAddress);
    const addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual([newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(1);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({ ethereum: [newAddress] });
  });

  it("should add a second address and return addresses sorted by insertion", async () => {
    const newAddress = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    await store.addAddress("ethereum", newAddress);
    let addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual([newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(1);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({ ethereum: [newAddress] });

    const newAddress2 = "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1";
    await store.addAddress("ethereum", newAddress2);
    addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual([newAddress2, newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(2);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({ ethereum: [newAddress2, newAddress] });
  });

  it("should replace at first place when an address is already saved", async () => {
    const newAddress = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    await store.addAddress("ethereum", newAddress);
    let addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual([newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(1);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({ ethereum: [newAddress] });

    const newAddress2 = "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1";
    await store.addAddress("ethereum", newAddress2);
    addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual([newAddress2, newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(2);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({ ethereum: [newAddress2, newAddress] });

    await store.addAddress("ethereum", newAddress);
    addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual([newAddress, newAddress2]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(3);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({ ethereum: [newAddress, newAddress2] });
  });

  it("should replace at first place and remove last element when addresses exceed count limit", async () => {
    let expectedAddresses: string[] = [];
    for (let index = 0; index < RECENT_ADDRESSES_COUNT_LIMIT; index++) {
      await store.addAddress("ethereum", `0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3${index}`);
      expectedAddresses.unshift(`0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3${index}`);
    }

    let addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual(expectedAddresses);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(RECENT_ADDRESSES_COUNT_LIMIT);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({ ethereum: expectedAddresses });

    const newAddress2 = "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1";
    expectedAddresses.splice(expectedAddresses.length - 1, 1);
    expectedAddresses = [newAddress2, ...expectedAddresses];

    await store.addAddress("ethereum", newAddress2);
    addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual(expectedAddresses);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(RECENT_ADDRESSES_COUNT_LIMIT + 1);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({ ethereum: expectedAddresses });
  });

  it("should add an address of a different currency", async () => {
    const newAddress = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    await store.addAddress("ethereum", newAddress);

    let addresses = store.getAddresses("ethereum");
    expect(addresses).toEqual([newAddress]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(1);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({ ethereum: [newAddress] });

    const newAddress2 = "bc1pxlmrudqyq8qd8pfsc4mpmlaw56x6vtcr9m8nvp8kj3gckefc4kmqhkg4l7";
    await store.addAddress("bitcoin", newAddress2);

    addresses = store.getAddresses("bitcoin");
    expect(addresses).toEqual([newAddress2]);
    expect(onAddAddressCompleteMock).toHaveBeenCalledTimes(2);
    expect(onAddAddressCompleteMock).toHaveBeenCalledWith({
      ethereum: [newAddress],
      bitcoin: [newAddress2],
    });
  });
});
