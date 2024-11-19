// Source: https://github.com/ecadlabs/taquito/blob/97832fc088eccb93c152659367618ce1782a8b51/packages/taquito-ledger-signer/src/taquito-ledger-signer.ts#L187C23-L187C32
export function combine(transaction: string, signature: string): string {
  return `${transaction}${signature}`.slice(2);
}
