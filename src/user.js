// @flow
import { getEnv } from "./env";
import { sha256 } from "./crypto";

const userHashesPerUserId = (userId: string) => {
  const firmwareSalt = sha256(userId + "|firmwareSalt")
    .toString("hex")
    .slice(0, 6);
  return { firmwareSalt };
};

let cache;
export const getUserHashes = () => {
  const userId = getEnv("USER_ID");
  if (cache && userId === cache.userId) {
    return cache.value;
  }
  cache = {
    userId,
    value: userHashesPerUserId(userId),
  };
  return cache.value;
};
