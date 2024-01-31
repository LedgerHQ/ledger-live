import sha from "sha.js";
function sha256(buffer: Buffer | string) {
  return sha("sha256").update(buffer).digest();
}
const userHashesPerUserId = (userId: string) => {
  const firmwareSalt = sha256(userId + "|firmwareSalt")
    .toString("hex")
    .slice(0, 6);
  const endpointOverrides100 = sha256(userId + "|endpoint").readUInt16BE(0) % 100;
  return {
    firmwareSalt,
    endpointOverrides100,
  };
};

let cache;
export const getUserHashes = (userId: string) => {
  if (cache && userId === cache.userId) {
    return cache.value;
  }

  cache = {
    userId,
    value: userHashesPerUserId(userId),
  };
  return cache.value;
};
