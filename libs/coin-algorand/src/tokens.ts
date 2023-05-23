export const addPrefixToken = (tokenId: string) => `algorand/asa/${tokenId}`;

export const extractTokenId = (tokenId: string) => {
  return tokenId.split("/")[2];
};
