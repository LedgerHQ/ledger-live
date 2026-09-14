export const encode = (transaction: string, signature: string, publicKey?: string) => {
  // sample encoding
  return `${transaction}${publicKey}${signature}encodedTx`;
};
