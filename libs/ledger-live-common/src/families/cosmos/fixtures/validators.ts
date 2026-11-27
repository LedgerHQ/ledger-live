export type ChainValidators = { validator: string; otherValidator: string };

export const VALIDATORS: Record<string, ChainValidators> = {
  cosmos: {
    validator: "cosmosvaloper19rl4cm2hmr8afy4kldpxz3fka4jguq0ae5egnx",
    otherValidator: "cosmosvaloper1n30pkrfl0fxzazmdpudrchnmn5h55mywu6cy93",
  },
  osmo: {
    validator: "osmovaloper19rl4cm2hmr8afy4kldpxz3fka4jguq0awvkw7q",
    otherValidator: "osmovaloper1n30pkrfl0fxzazmdpudrchnmn5h55mywtzhzgh",
  },
  coreum: {
    validator: "corevaloper19rl4cm2hmr8afy4kldpxz3fka4jguq0a4strcs",
    otherValidator: "corevaloper1n30pkrfl0fxzazmdpudrchnmn5h55myws720w8",
  },
  injective: {
    validator: "injvaloper19rl4cm2hmr8afy4kldpxz3fka4jguq0ap00uvf",
    otherValidator: "injvaloper1n30pkrfl0fxzazmdpudrchnmn5h55mywypws67",
  },
  babylon: {
    validator: "bbnvaloper19rl4cm2hmr8afy4kldpxz3fka4jguq0akuk3vd",
    otherValidator: "bbnvaloper1n30pkrfl0fxzazmdpudrchnmn5h55mywnjha66",
  },
  mantra: {
    validator: "mantravaloper19rl4cm2hmr8afy4kldpxz3fka4jguq0ansxhs2",
    otherValidator: "mantravaloper1n30pkrfl0fxzazmdpudrchnmn5h55mywk78mxa",
  },
  xion: {
    validator: "xionvaloper19rl4cm2hmr8afy4kldpxz3fka4jguq0a42uepd",
    otherValidator: "xionvaloper1n30pkrfl0fxzazmdpudrchnmn5h55mywsya4h6",
  },
  persistence: {
    validator: "persistencevaloper19rl4cm2hmr8afy4kldpxz3fka4jguq0amgtncg",
    otherValidator: "persistencevaloper1n30pkrfl0fxzazmdpudrchnmn5h55myw7x2lwl",
  },
  crypto_org: {
    validator: "crocncl19rl4cm2hmr8afy4kldpxz3fka4jguq0a8kxdpc",
    otherValidator: "crocncl1n30pkrfl0fxzazmdpudrchnmn5h55mywzc8ph0",
  },
};
