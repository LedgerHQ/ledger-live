export enum QueryKey {
  //mutations
  destroyTrustchain = "destroyTrustchain",

  //getters
  restoreTrustchain = "restoreTrustchain",
  getMembers = "useGetMembers",
  fetchTrustchainStatus = "fetchTrustchainStatus",
  fetchCloudSyncStatus = "fetchCloudSyncStatus",
}

export enum ErrorType {
  NO_TRUSTCHAIN = "No such trustchain",
}
