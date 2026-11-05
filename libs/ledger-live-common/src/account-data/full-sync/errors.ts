export class FullSyncAccountNotFoundError extends Error {
  override name = "FullSyncAccountNotFoundError";
}

/** The asset is not the account's coin nor a token of its network. */
export class FullSyncAssetNotOnAccountError extends Error {
  override name = "FullSyncAssetNotOnAccountError";
}
