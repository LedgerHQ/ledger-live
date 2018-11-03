// @flow

import React from "react";
import { Trans } from "react-i18next";
import { Observable, from, defer, throwError, timer } from "rxjs";
import { map, retryWhen, mergeMap, catchError, first } from "rxjs/operators";
import type Transport from "@ledgerhq/hw-transport";
import type { CryptoCurrency, Account } from "@ledgerhq/live-common/lib/types";
import getAddress from "@ledgerhq/live-common/lib/hw/getAddress";
import {
  WrongDeviceForAccount,
  CantOpenDevice,
  UpdateYourApp,
} from "@ledgerhq/live-common/lib/errors";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/live-common/lib/derivation";
import { open } from "../../logic/hw";
import colors, { rgba } from "../../colors";
import BluetoothScanning from "../BluetoothScanning";
import Spinning from "../Spinning";
import DeviceNanoAction from "../DeviceNanoAction";
import Button from "../Button";
import CurrencyIcon from "../CurrencyIcon";
import Rounded from "../Rounded";
import LText from "../LText";
import LiveLogo from "../../icons/LiveLogoIcon";
import getFirmwareInfo from "../../logic/hw/getFirmwareInfo";
import { rejectionOp } from "../DebugRejectSwitch";

import type { Step } from "./types";
import { RenderStep } from "./StepRenders";

const withDevice = (deviceId: string) => <T>(
  job: (t: Transport<*>) => Observable<T>,
): Observable<T> =>
  defer(() =>
    from(
      open(deviceId).catch(e => {
        throw new CantOpenDevice(e.message);
      }),
    ),
  ).pipe(
    mergeMap(transport =>
      job(transport).pipe(
        // throw error after closing the transport
        catchError(error =>
          from(
            transport.close().then(() => {
              throw error;
            }),
          ),
        ),
        // returns meta after a close, whatever if close succeed
        mergeMap(meta => from(transport.close().then(() => meta, () => meta))),
      ),
    ),
  );

const genericCanRetryOnError = err => {
  if (err instanceof WrongDeviceForAccount) return false;
  if (err instanceof CantOpenDevice) return false;
  if (err instanceof UpdateYourApp) return false;
  return true;
};

const retryWhileErrors = (
  acceptError: Error => boolean = genericCanRetryOnError,
) => (attempts: Observable<any>): Observable<any> =>
  attempts.pipe(
    mergeMap(error => {
      if (!acceptError(error)) {
        return throwError(error);
      }
      return timer(200);
    }),
  );

export const connectingStep: Step = {
  Body: ({ deviceName }: *) => (
    <RenderStep
      icon={<BluetoothScanning isAnimated />}
      title={
        <Trans
          i18nKey="SelectDevice.steps.connecting.title"
          values={{ deviceName }}
        />
      }
      description={
        <Trans i18nKey="SelectDevice.steps.connecting.description" />
      }
    />
  ),
  run: deviceId =>
    withDevice(deviceId)(() => from([{}])).pipe(
      rejectionOp(() => new CantOpenDevice()),
    ),
};

export const dashboard: Step = {
  Body: () => (
    <RenderStep
      icon={
        <Spinning>
          <LiveLogo size={32} color={colors.grey} />
        </Spinning>
      }
      title={<Trans i18nKey="SelectDevice.steps.dashboard.title" />}
      description={<Trans i18nKey="SelectDevice.steps.dashboard.description" />}
    />
  ),
  run: (deviceId, meta) =>
    withDevice(deviceId)(transport => from(getFirmwareInfo(transport)))
      .pipe(retryWhen(retryWhileErrors()))
      .pipe(
        map(firmwareInfo => ({
          ...meta,
          firmwareInfo,
        })),
        rejectionOp(() => new CantOpenDevice()),
      ),
};

export const currencyApp: CryptoCurrency => Step = currency => ({
  Body: () => (
    <RenderStep
      icon={
        <Rounded bg={rgba(currency.color, 0.1)}>
          <CurrencyIcon currency={currency} size={32} />
        </Rounded>
      }
      title={
        <Trans
          i18nKey="SelectDevice.steps.currencyApp.title"
          values={{
            managerAppName: currency.managerAppName,
            currencyName: currency.name,
          }}
        />
      }
      description={
        <Trans
          i18nKey="SelectDevice.steps.currencyApp.description"
          values={{
            managerAppName: currency.managerAppName,
            currencyName: currency.name,
          }}
        />
      }
    />
  ),
  run: (deviceId, meta) =>
    withDevice(deviceId)(transport =>
      from(
        getAddress(
          transport,
          currency,
          runDerivationScheme(
            getDerivationScheme({ currency, derivationMode: "" }),
            currency,
          ),
        ),
      ),
    )
      .pipe(retryWhen(retryWhileErrors()))
      .pipe(
        map(addressInfo => ({
          ...meta,
          addressInfo,
        })),
        rejectionOp(() => new CantOpenDevice()),
      ),
});

export const accountApp: Account => Step = account => ({
  Body: () => (
    <RenderStep
      icon={
        <Rounded bg={rgba(account.currency.color, 0.1)}>
          <CurrencyIcon currency={account.currency} size={32} />
        </Rounded>
      }
      title={
        <Trans
          i18nKey="SelectDevice.steps.accountApp.title"
          values={{
            managerAppName: account.currency.managerAppName,
            currencyName: account.currency.name,
            accountName: account.name,
          }}
        />
      }
      description={
        <Trans
          i18nKey="SelectDevice.steps.accountApp.description"
          values={{
            managerAppName: account.currency.managerAppName,
            currencyName: account.currency.name,
            accountName: account.name,
          }}
        />
      }
    />
  ),
  run: (deviceId, meta) =>
    withDevice(deviceId)(transport =>
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
    ).pipe(
      retryWhen(retryWhileErrors()),
      rejectionOp(
        () => new WrongDeviceForAccount("", { accountName: account.name }),
      ),
    ),
});

export const receiveVerifyStep: Account => Step = account => ({
  Body: ({ onDone }: *) => (
    <RenderStep
      icon={<DeviceNanoAction width={240} validationOnScreen />}
      title={
        <Trans
          i18nKey="SelectDevice.steps.receiveVerify.title"
          values={{
            currencyName: account.currency.name,
            accountName: account.name,
          }}
        />
      }
      description={
        <Trans
          i18nKey="SelectDevice.steps.receiveVerify.description"
          values={{
            currencyName: account.currency.name,
            accountName: account.name,
          }}
        >
          A {account.currency.name} address
          <LText semiBold style={{ color: colors.darkBlue }}>
            will be displayed
          </LText>{" "}
          on your device. Carefully verify that it matches the address on your
          phone.
        </Trans>
      }
    >
      <Button
        type="primary"
        onPress={onDone}
        title={<Trans i18nKey="SelectDevice.steps.receiveVerify.action" />}
      />
    </RenderStep>
  ),
  // pass as soon as you tap onDone
  run: (deviceId, meta, onDoneO) =>
    onDoneO.pipe(
      map(() => meta),
      first(),
    ),
});
