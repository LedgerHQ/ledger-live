/**
 * Client-side Braze identity transitions for consent changes.
 *
 * `wipeData()` only clears **local** SDK state on the device and disables the SDK
 * until `enableSDK()`. It does **not** delete the Braze server profile
 * (`/users/delete`). See https://www.braze.com/docs/developer_guide/analytics/managing_data_collection/
 */

export type BrazeIdentityLifecycleSdk = {
  wipeData: () => void | Promise<void>;
  enableSDK: () => void | Promise<void>;
  changeUser: (userId: string) => void | Promise<void>;
  refreshContentCards: () => void | Promise<void>;
};

export type BrazeOptInIdentity = {
  userId: string;
};

/**
 * Opt-in → opt-out: reset the local SDK session and refetch broad Content Cards.
 * Does not assign an `external_id`.
 */
export async function runBrazeOptOutTransition(sdk: BrazeIdentityLifecycleSdk): Promise<void> {
  await sdk.wipeData();
  await sdk.enableSDK();
  await sdk.refreshContentCards();
}

/**
 * Opt-out → opt-in: reset the local SDK session, identify with the real user id,
 * then refetch Content Cards.
 */
export async function runBrazeOptInTransition(
  sdk: BrazeIdentityLifecycleSdk,
  identity: BrazeOptInIdentity,
): Promise<void> {
  if (!identity.userId) {
    throw new Error("Braze opt-in transition requires a user id");
  }

  await sdk.wipeData();
  await sdk.enableSDK();
  await sdk.changeUser(identity.userId);
  await sdk.refreshContentCards();
}
