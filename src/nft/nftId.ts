export const encodeNftId = (
  accountId: string,
  contract: string,
  tokenId: string
): string => {
  return `${accountId}+${contract}+${tokenId.toString()}`;
};

export const decodeNftId = (id: string): unknown => {
  const [accountId, contract, tokenId] = id.split("+");

  return {
    accountId,
    contract,
    tokenId,
  };
};
