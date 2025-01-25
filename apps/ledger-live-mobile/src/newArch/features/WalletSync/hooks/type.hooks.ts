export enum QueryKey {
  getMembers = "useGetMembers",
  destroyTrustchain = "useDestroyTrustchain",
  fetchTrustchainStatus = "useFetchTrustchainStatus",
  fetchCloudSyncStatus = "useFetchCloudSyncStatus",
  restoreTrustchain = "useRestoreTrustchain",
}

export enum ErrorType {
  NO_TRUSTCHAIN = "No such trustchain",
  NULL = '["useGetMembers",null] data is undefined',
}
