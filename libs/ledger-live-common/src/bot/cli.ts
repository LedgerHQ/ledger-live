"use strict";

import "../__tests__/test-helpers/environment";
import { bot } from ".";

const {
  BOT_FILTER_CURRENCIES,
  BOT_FILTER_FAMILIES,
  BOT_DISABLED_CURRENCIES,
  BOT_DISABLED_FAMILIES,
} = process.env;

const arg: Partial<{
  filter: Partial<{ currencies: string[]; families: string[]; mutation: string }>;
  disabled: Partial<{ currencies: string[]; families: string[] }>;
}> = {};

arg.filter = {};
arg.disabled = {};

if (BOT_FILTER_CURRENCIES) {
  arg.filter.currencies = BOT_FILTER_CURRENCIES.split(",");
}

if (BOT_FILTER_FAMILIES) {
  arg.filter.families = BOT_FILTER_FAMILIES?.split(",");
}

if (BOT_DISABLED_CURRENCIES) {
  arg.disabled.currencies = BOT_DISABLED_CURRENCIES.split(",");
}

if (BOT_DISABLED_FAMILIES) {
  arg.disabled.families = BOT_DISABLED_FAMILIES.split(",");
}

bot(arg);
