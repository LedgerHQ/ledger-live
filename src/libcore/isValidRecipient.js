// @flow

import { InvalidAddress } from "@ledgerhq/errors";
import type { CryptoCurrency } from "../types";
import { withLibcoreF } from "./access";

type F = ({
  currency: CryptoCurrency,
  recipient: string
}) => Promise<?Error>;

export const isValidRecipient: F = withLibcoreF(
  core => async ({ currency, recipient }) => {
    const poolInstance = core.getPoolInstance();
    const currencyCore = await poolInstance.getCurrency(currency.id);
    const value = await core.Address.isValid(recipient, currencyCore);
    if (value) {
      return Promise.resolve(null);
    }

    return Promise.reject(
      new InvalidAddress(null, { currencyName: currency.name })
    );
  }
);
