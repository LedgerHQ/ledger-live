type LegacyAccountShape = {
  id: string;
  currency: { id: string };
  subAccounts?: readonly { token: { id: string } }[];
};

type ReceiveAccount<A extends LegacyAccountShape> = {
  account: A | NonNullable<A["subAccounts"]>[number];
  parentAccount?: A;
};

/** The legacy account the receive tool's row targets: the main account, or its token account. */
export function findReceiveAccount<A extends LegacyAccountShape>(
  accounts: readonly A[],
  { legacyAccountId, assetId }: { legacyAccountId: string; assetId: string },
): ReceiveAccount<A> | undefined {
  const main = accounts.find(account => account.id === legacyAccountId);
  if (!main) return undefined;
  if (main.currency.id === assetId) return { account: main };
  const token = main.subAccounts?.find(account => account.token.id === assetId);
  return token && { account: token, parentAccount: main };
}
