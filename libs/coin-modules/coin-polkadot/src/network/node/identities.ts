import { AccountId, Registration } from "@polkadot/types/interfaces";
import { ITuple } from "@polkadot/types/types";
import { Bytes, Data, Option } from "@polkadot/types";
import { u8aToString } from "@polkadot/util";
import { ApiPromise } from "@polkadot/api";
import { IIdentity } from "../sidecar.types";
import getApiPromise from "./apiPromise";

export async function multiIdentities(addresses: AccountId[] | string[]): Promise<IIdentity[]> {
  const api = await getApiPromise();

  const [identities, superOfOpts] = await Promise.all([
    api.query.identity.identityOf.multi(addresses),
    api.query.identity.superOf.multi<Option<ITuple<[AccountId, Data]>>>(addresses),
  ]);

  const unwrappedSuperOfs = superOfOpts.map(superOfOpt =>
    superOfOpt?.isSome ? superOfOpt?.unwrap() : undefined,
  );

  const parentIdentities = await fetchParentIdentityMap(api)(unwrappedSuperOfs);

  return identities.map((identity, index) =>
    extractIdentity(identity, unwrappedSuperOfs[index], parentIdentities),
  );
}

const fetchParentIdentityMap =
  (api: ApiPromise) =>
  async (
    unwrappedSuperOfs: (ITuple<[AccountId, Data]> | undefined)[],
  ): Promise<Map<string, Option<ITuple<[Registration, Option<Bytes>]>>>> => {
    const addresses = unwrappedSuperOfs
      .map(superOf => superOf && superOf[0])
      .filter(Boolean) as AccountId[]; // Remove undefineds

    const uniqAddresses = [...new Set(addresses)]; // Avoid querying the same address multiple times

    const parentIdentities = await api.query.identity.identityOf.multi(uniqAddresses);

    const map = new Map<string, Option<ITuple<[Registration, Option<Bytes>]>>>(
      addresses.map((addr, index) => [addr.toString(), parentIdentities[index]]),
    );

    return map;
  };

const extractIdentity = (
  identityOfOpt: Option<ITuple<[Registration, Option<Bytes>]>>,
  superOf?: ITuple<[AccountId, Data]>,
  parentIdentities?: Map<string, Option<ITuple<[Registration, Option<Bytes>]>>>,
): IIdentity => {
  // Choose best identity, parent identity as a fallback if any.
  const identity = identityOfOpt?.isSome
    ? identityOfOpt
    : superOf && parentIdentities
    ? parentIdentities.get(superOf[0].toString())
    : null;

  if (!identity || identity.isNone) {
    return { judgements: [] };
  }

  const { info, judgements } = identity.unwrap()[0];
  const topDisplay = dataAsString(info.display);

  return {
    display: superOf ? dataAsString(superOf[1]) || topDisplay : topDisplay,
    displayParent: superOf ? topDisplay : undefined,
    email: dataAsString(info.email),
    image: dataAsString(info.image),
    judgements: judgements.map(j => [j[0].toString(), j[1]]),
    legal: dataAsString(info.legal),
    other: info.additional.reduce(
      (other: Record<string, string>, [_key, _value]): Record<string, string> => {
        const key = dataAsString(_key);
        const value = dataAsString(_value);

        if (key && value) {
          other[key] = value;
        }

        return other;
      },
      {},
    ),
    parent: superOf ? superOf[0].toString() : undefined,
    pgp: info.pgpFingerprint.isSome ? info.pgpFingerprint.unwrap().toHex() : undefined,
    riot: dataAsString(info.riot),
    twitter: dataAsString(info.twitter),
    web: dataAsString(info.web),
  };
};

/**
 * @source https://github.com/polkadot-js/api/blob/master/packages/api-derive/src/accounts/info.ts
 */
function dataAsString(data: Data): string | undefined {
  return data.isRaw ? u8aToString(data.asRaw.toU8a(true)) : data.isNone ? undefined : data.toHex();
}
