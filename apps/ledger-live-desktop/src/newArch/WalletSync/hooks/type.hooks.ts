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
  JWT_EXPIRED_REFRESH = "JWT is expired, please call /refresh to refresh it",
  JWT_EXPIRED_CHALLENGE = "JWT is expired, please call /challenge to get a new one",

  NOT_MEMBER = "Not a member of trustchain",
  NO_TRUSTCHAIN = "No such trustchain",
  NO_PERMISSION = " JWT contains no permission",
  NO_PERMISSION_FOR_TRUSTCHAIN = "JWT contains no permission for trustchain",
}
