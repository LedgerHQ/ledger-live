export enum QueryKey {
  //mutations
  deleteMember = "removeMember",
  addMember = "addMember",
  destroyTrustchain = "destroyTrustchain",

  //getters
  auth = "auth",
  restoreTrustchain = "restoreTrustchain",
  refreshAuth = "refreshAuth",
  getMembers = "useGetMembers",
}

export enum ErrorType {
  NO_TRUSTCHAIN = "No such trustchain",
}
