import { CryptoAssetsStore } from "./type";

export let cryptoAssetsStore: CryptoAssetsStore | undefined = undefined;

export function setCryptoAssetsStore(store: CryptoAssetsStore) {
  cryptoAssetsStore = store;
}
