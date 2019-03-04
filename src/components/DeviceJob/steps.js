// @flow

import React from "react";
import { Trans } from "react-i18next";
import { from } from "rxjs";
import { map, first } from "rxjs/operators";
import type { CryptoCurrency, Account } from "@ledgerhq/live-common/lib/types";
import getAddress from "@ledgerhq/live-common/lib/hw/getAddress";
import {
  WrongDeviceForAccount,
  CantOpenDevice,
} from "@ledgerhq/live-common/lib/errors";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/live-common/lib/derivation";
import {
  withDevice,
  withDevicePolling,
} from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import getDeviceNameTransport from "@ledgerhq/live-common/lib/hw/getDeviceName";
import editDeviceNameTransport from "@ledgerhq/live-common/lib/hw/editDeviceName";
import checkDeviceForManager from "@ledgerhq/live-common/lib/hw/checkDeviceForManager";
import { deviceNames } from "../../wording";
import BluetoothScanning from "../BluetoothScanning";
import DeviceNanoAction from "../DeviceNanoAction";
import Button from "../Button";
import RoundedCurrencyIcon from "../RoundedCurrencyIcon";
import { rejectionOp } from "../DebugRejectSwitch";

import type { Step } from "./types";
import { RenderStep } from "./StepRenders";

export const connectingStep: Step = {
  Body: ({ meta }: *) => (
    <RenderStep
      icon={<BluetoothScanning isAnimated />}
      title={
        <Trans
          i18nKey="SelectDevice.steps.connecting.title"
          values={{ deviceName: meta.deviceName }}
        />
      }
      description={
        <Trans i18nKey="SelectDevice.steps.connecting.description" />
      }
    />
  ),
  run: meta =>
    withDevice(meta.deviceId)(() => from([meta])).pipe(
      rejectionOp(() => new CantOpenDevice()),
    ),
};

// TODO genuine step

export const dashboard: Step = {
  Body: ({ meta }: *) => (
    <RenderStep
      icon={
        <DeviceNanoAction
          screen="home"
          modelId={meta.modelId}
          wired={meta.wired}
        />
      }
      title={
        <Trans
          i18nKey="SelectDevice.steps.dashboard.title"
          values={deviceNames.nanoX}
        />
      }
    />
  ),
  run: meta =>
    withDevicePolling(meta.deviceId)(transport =>
      from(getDeviceInfo(transport)),
    ).pipe(
      map(deviceInfo => ({
        ...meta,
        deviceInfo,
      })),
      rejectionOp(() => new CantOpenDevice()),
    ),
};

export const genuineCheck: Step = {
  Body: ({ meta }: *) => (
    <RenderStep
      icon={
        <DeviceNanoAction
          screen="validation"
          action="both"
          modelId={meta.modelId}
          wired={meta.wired}
        />
      }
      title={
        <Trans
          i18nKey="SelectDevice.steps.genuineCheck.title"
          values={deviceNames.nanoX}
        />
      }
    />
  ),
  run: meta =>
    withDevice(meta.deviceId)(transport =>
      checkDeviceForManager(transport, meta.deviceInfo),
    ).pipe(
      map(genuineResult => ({
        ...meta,
        genuineResult,
      })),
    ),
};

export const currencyApp: CryptoCurrency => Step = currency => ({
  Body: () => (
    <RenderStep
      icon={<RoundedCurrencyIcon currency={currency} size={32} />}
      title={
        <Trans
          i18nKey="SelectDevice.steps.currencyApp.title"
          values={{
            ...deviceNames.nanoX,
            managerAppName: currency.managerAppName,
            currencyName: currency.name,
          }}
        />
      }
      description={
        <Trans
          i18nKey="SelectDevice.steps.currencyApp.description"
          values={{
            ...deviceNames.nanoX,
            managerAppName: currency.managerAppName,
            currencyName: currency.name,
          }}
        />
      }
    />
  ),
  run: meta =>
    withDevicePolling(meta.deviceId)(transport =>
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
    ).pipe(
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
      icon={<RoundedCurrencyIcon currency={account.currency} size={32} />}
      title={
        <Trans
          i18nKey="SelectDevice.steps.accountApp.title"
          values={{
            ...deviceNames.nanoX,
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
            ...deviceNames.nanoX,
            managerAppName: account.currency.managerAppName,
            currencyName: account.currency.name,
            accountName: account.name,
          }}
        />
      }
    />
  ),
  run: meta =>
    withDevicePolling(meta.deviceId)(transport =>
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
      rejectionOp(
        () => new WrongDeviceForAccount("", { accountName: account.name }),
      ),
    ),
});

export const receiveVerifyStep: Account => Step = account => ({
  Body: ({ onDone, meta }: *) => (
    <RenderStep
      icon={
        <DeviceNanoAction
          width={240}
          screen="validation"
          modelId={meta.modelId}
          wired={meta.wired}
        />
      }
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
          }}
        />
      }
    >
      <Button
        event="DeviceJobDone"
        type="primary"
        onPress={onDone}
        title={<Trans i18nKey="SelectDevice.steps.receiveVerify.action" />}
      />
    </RenderStep>
  ),
  // pass as soon as you tap onDone
  run: (meta, onDoneO) =>
    onDoneO.pipe(
      map(() => meta),
      first(),
    ),
});

export const getDeviceName: Step = {
  Body: ({ meta }: *) => (
    <RenderStep
      icon={
        <DeviceNanoAction
          width={240}
          action="both"
          screen="validation"
          modelId={meta.modelId}
          wired={meta.wired}
        />
      }
      title={<Trans i18nKey="SelectDevice.steps.getDeviceName.title" />}
    />
  ),

  run: meta =>
    withDevice(meta.deviceId)(transport =>
      from(
        getDeviceNameTransport(transport).then(deviceName => ({
          ...meta,
          deviceName,
        })),
      ),
    ),
};

export const editDeviceName: string => Step = deviceName => ({
  Body: ({ meta }: *) => (
    <RenderStep
      icon={
        <DeviceNanoAction
          width={240}
          action="both"
          screen="validation"
          modelId={meta.modelId}
          wired={meta.wired}
        />
      }
      title={<Trans i18nKey="SelectDevice.steps.editDeviceName.title" />}
    />
  ),

  run: meta =>
    withDevice(meta.deviceId)(transport =>
      from(editDeviceNameTransport(transport, deviceName).then(() => meta)),
    ),
});
