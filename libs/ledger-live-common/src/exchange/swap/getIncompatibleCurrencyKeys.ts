import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { ExchangeSwap } from "./types";

type Keys = Partial<Record<CryptoCurrency["id"], { title: string; description: string }>>;

const INCOMPATIBLE_NANO_S_TOKENS_KEYS: Keys = {
  solana: {
    title: "swap.incompatibility.spl_tokens_title",
    description: "swap.incompatibility.spl_tokens_description",
  },
  solana_testnet: {
    title: "swap.incompatibility.spl_tokens_title",
    description: "swap.incompatibility.spl_tokens_description",
  },
  solana_devnet: {
    title: "swap.incompatibility.spl_tokens_title",
    description: "swap.incompatibility.spl_tokens_description",
  },
};

const INCOMPATIBLE_NANO_S_CURRENCY_KEYS: Keys = {
  ton: {
    title: "swap.incompatibility.ton_title",
    description: "swap.incompatibility.ton_description",
  },
  cardano: {
    title: "swap.incompatibility.ada_title",
    description: "swap.incompatibility.ada_description",
  },
  cardano_testnet: {
    title: "swap.incompatibility.ada_title",
    description: "swap.incompatibility.ada_description",
  },
  aptos: {
    title: "swap.incompatibility.apt_title",
    description: "swap.incompatibility.apt_description",
  },
  aptos_testnet: {
    title: "swap.incompatibility.apt_title",
    description: "swap.incompatibility.apt_description",
  },
  near: {
    title: "swap.incompatibility.near_title",
    description: "swap.incompatibility.near_description",
  },
  cosmos: {
    title: "swap.incompatibility.cosmos_title",
    description: "swap.incompatibility.cosmos_description",
  },
  cosmos_testnet: {
    title: "swap.incompatibility.cosmos_title",
    description: "swap.incompatibility.cosmos_description",
  },
};

export const getIncompatibleCurrencyKeys = (exchange: ExchangeSwap) => {
  const parentFrom =
    exchange.fromAccount.type === "TokenAccount"
      ? INCOMPATIBLE_NANO_S_TOKENS_KEYS[exchange.fromAccount.token.parentCurrency.id]
      : undefined;
  const parentTo =
    exchange.toAccount.type === "TokenAccount"
      ? INCOMPATIBLE_NANO_S_TOKENS_KEYS[exchange.toAccount.token.parentCurrency.id]
      : undefined;
  const from =
    exchange.fromAccount.type === "Account"
      ? INCOMPATIBLE_NANO_S_CURRENCY_KEYS[exchange.fromAccount.currency.id]
      : undefined;
  const to =
    exchange.toAccount.type === "Account"
      ? INCOMPATIBLE_NANO_S_CURRENCY_KEYS[exchange.toAccount.currency.id]
      : undefined;

  return parentFrom || parentTo || from || to;
};
