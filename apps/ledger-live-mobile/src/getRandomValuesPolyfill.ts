import { getRandomValues } from "expo-crypto";

if (typeof globalThis.crypto !== "object") {
  globalThis.crypto = {} as Crypto;
}

if (typeof globalThis.crypto.getRandomValues !== "function") {
  globalThis.crypto.getRandomValues = getRandomValues as Crypto["getRandomValues"];
}
