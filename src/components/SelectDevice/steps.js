// @flow

import React from "react";
import { Trans } from "react-i18next";
import { from } from "rxjs";
import type { CryptoCurrency, Account } from "@ledgerhq/live-common/lib/types";
import getAddress from "@ledgerhq/live-common/lib/hw/getAddress";
import { WrongDeviceForAccount } from "@ledgerhq/live-common/lib/errors";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/live-common/lib/derivation";
import type { Step } from "./types";
import colors from "../../colors";
import Spinning from "../Spinning";
import CurrencyIcon from "../CurrencyIcon";
import LiveLogo from "../../icons/LiveLogoIcon";
import getFirmwareInfo from "../../logic/hw/getFirmwareInfo";

export const connectingStep: Step = {
  icon: (
    <Spinning>
      <LiveLogo size={32} color={colors.grey} />
    </Spinning>
  ),
  title: <Trans i18nKey="SelectDevice.steps.connecting.title" />,
  description: <Trans i18nKey="SelectDevice.steps.connecting.description" />,
  run: () => from([{}]),
};

export const dashboard: Step = {
  icon: (
    <Spinning>
      <LiveLogo size={32} color={colors.grey} />
    </Spinning>
  ),
  title: <Trans i18nKey="SelectDevice.steps.dashboard.title" />,
  description: <Trans i18nKey="SelectDevice.steps.dashboard.description" />,
  run: (transport, meta) =>
    // TODO try again until condition reached
    from(
      getFirmwareInfo(transport).then(firmwareInfo => ({
        ...meta,
        firmwareInfo,
      })),
    ),
};

export const currencyApp: CryptoCurrency => Step = currency => ({
  icon: <CurrencyIcon currency={currency} size={32} />,
  title: (
    <Trans
      i18nKey="SelectDevice.steps.currencyApp.title"
      values={{
        managerAppName: currency.managerAppName,
        currencyName: currency.name,
      }}
    />
  ),
  description: (
    <Trans
      i18nKey="SelectDevice.steps.currencyApp.description"
      values={{
        managerAppName: currency.managerAppName,
        currencyName: currency.name,
      }}
    />
  ),
  run: (transport, meta) =>
    // TODO try again for some errors until condition reached
    from(
      getAddress(
        transport,
        currency,
        runDerivationScheme(
          getDerivationScheme({ currency, derivationMode: "" }),
          currency,
        ),
      ).then(addressInfo => ({
        ...meta,
        addressInfo,
      })),
    ),
});

export const accountApp: Account => Step = account => ({
  icon: <CurrencyIcon currency={account.currency} size={32} />,
  title: (
    <Trans
      i18nKey="SelectDevice.steps.accountApp.title"
      values={{
        managerAppName: account.currency.managerAppName,
        currencyName: account.currency.name,
        accountName: account.name,
      }}
    />
  ),
  description: (
    <Trans
      i18nKey="SelectDevice.steps.accountApp.description"
      values={{
        managerAppName: account.currency.managerAppName,
        currencyName: account.currency.name,
        accountName: account.name,
      }}
    />
  ),
  run: (transport, meta) =>
    // TODO try again for some errors until condition reached
    from(
      getAddress(transport, account.currency, account.freshAddressPath).then(
        addressInfo => {
          if (addressInfo.address !== account.freshAddress) {
            throw new WrongDeviceForAccount("WrongDeviceForAccount", {
              accountName: account.name,
            });
          }
          return {
            ...meta,
            addressInfo,
          };
        },
      ),
    ),
});
