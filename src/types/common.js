// @flow

import type { Currency, Unit } from "@ledgerhq/currencies";

// FIXME some types have diverged a bit from the desktop project; we'll converge later

export type Operation = {
  id: string,
  account: Account,
  address: string,
  amount: number,
  hash: string,
  receivedAt: string,
  confirmations: number
};

export type Account = {
  id: string,
  archived: boolean,
  address: string,
  balance: number,
  currency: Currency,
  coinType: number,
  name: string,
  operations: Operation[],
  unit: Unit,
  minConfirmations: number
};

export type SettingsDisplay = {
  language: string
};

export type SettingsMoney = {
  counterValue: string
};

export type Settings = SettingsDisplay & SettingsMoney;
