// @flow
// set and get environment & config variables

// initialized with default values
const env = {
  SHOW_LEGACY_NEW_ACCOUNT: false,
  WITH_DEVICE_POLLING_DELAY: 500,
  FORCE_PROVIDER: 0, // in zero case, we will not force provider. otherwise you can force one.
  LEDGER_REST_API_BASE: "https://explorers.api.live.ledger.com",
  MANAGER_API_BASE: "https://manager.api.live.ledger.com/api",
  BASE_SOCKET_URL: "wss://api.ledgerwallet.com/update",
  EXPLORER_V2:
    "https://explorers.api.live.ledger.com/blockchain/v2/$ledgerExplorerId",
  EXPLORER_V3:
    "http://$ledgerExplorerId.explorers.prod.aws.ledger.fr/blockchain/v3",
  EXPERIMENTAL_EXPLORERS: false
};

export type EnvName = $Keys<typeof env>;
export type EnvValue<Name> = $ElementType<typeof env, Name>;

// implementation can override the defaults typically at boot of the app but potentially over time
export const setEnv = <Name: EnvName>(name: Name, value: EnvValue<Name>) => {
  // $FlowFixMe flow don't seem to type proof it
  env[name] = value;
};

// Usage: you must use getEnv at runtime because the env might be settled over time. typically will allow us to dynamically change them on the interface (e.g. some sort of experimental flags system)
export const getEnv = <Name: EnvName>(name: Name): EnvValue<Name> => {
  // $FlowFixMe flow don't seem to type proof it
  return env[name];
};
