export async function fetchTransactions(address: string, gt?: string) {
  if (!address) {
    return [];
  }

  let query = GetAccountTransactionsData;
  if (gt) {
    query = GetAccountTransactionsDataGt;
  }

  const queryResponse = await this.apolloClient.query<
    GetAccountTransactionsDataQuery,
    GetAccountTransactionsDataGtQueryVariables
  >({
    query,
    variables: {
      address,
      limit: 1000,
      gt,
    },
    fetchPolicy: "network-only",
  });

  return Promise.all(
    queryResponse.data.address_version_from_move_resources.map(({ transaction_version }) => {
      return this.richItemByVersion(transaction_version);
    }),
  );
}
