// @flow
import Prando from "prando";
import { getEnv } from "./env";

const hexaChars = "0123456789ABCDEF";
const userHashesPerUserId = (userId: string) => {
  const rng = new Prando(userId);
  const firmwareNonce = rng.nextString(6, hexaChars);
  return { firmwareNonce };
};

let cache;
export const getUserHashes = () => {
  const userId = getEnv("USER_ID");
  if (cache && userId === cache.userId) {
    return cache.value;
  }
  cache = {
    userId,
    value: userHashesPerUserId(userId)
  };
  return cache.value;
};
