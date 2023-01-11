export const encodeNftId = (
  accountId: string,
  contract: string,
  tokenId: string,
  currencyId: string
): string => {
  return `${accountId}+${contract}+${tokenId}+${currencyId}`;
};

export const decodeNftId = (
  id: string
): {
  accountId: string;
  contract: string;
  tokenId: string;
  currencyId: string;
} => {
  const [accountId, contract, tokenId, currencyId] = id.split("+");

  return {
    accountId,
    contract,
    tokenId,
    currencyId,
  };
};
