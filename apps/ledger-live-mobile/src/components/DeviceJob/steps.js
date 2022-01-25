// @flow

import React from "react";
import { Trans } from "react-i18next";
import { from } from "rxjs";
import { map, retryWhen } from "rxjs/operators";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { getDeviceModel } from "@ledgerhq/devices";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { CantOpenDevice } from "@ledgerhq/errors";
import {
  withDevice,
  withDevicePolling,
  retryWhileErrors,
  genericCanRetryOnError,
} from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceNameTransport from "@ledgerhq/live-common/lib/hw/getDeviceName";
import editDeviceNameTransport from "@ledgerhq/live-common/lib/hw/editDeviceName";
import BluetoothScanning from "../BluetoothScanning";
import DeviceNanoAction from "../DeviceNanoAction";
import RoundedCurrencyIcon from "../RoundedCurrencyIcon";
import { rejectionOp } from "../../logic/debugReject";

import type { Step } from "./types";
import { RenderStep } from "./StepRenders";

const inferWordingValues = meta => {
  const deviceModel = meta.modelId ? getDeviceModel(meta.modelId) : {};
  return {
    productName: deviceModel.productName,
    deviceName: meta.deviceName,
  };
};

export const connectingStep: Step = {
  Body: ({ meta }: *) => {
    const usbOnly = meta.modelId !== "nanoX";
    return (
      <RenderStep
        icon={
          usbOnly ? (
            <DeviceNanoAction modelId={meta.modelId} wired={meta.wired} />
          ) : (
            <BluetoothScanning isAnimated />
          )
        }
        title={
          <Trans
            i18nKey="SelectDevice.steps.connecting.title"
            values={inferWordingValues(meta)}
          />
        }
        description={
          <Trans
            i18nKey={`SelectDevice.steps.connecting.description.${
              !usbOnly ? "ble" : "usb"
            }`}
            values={inferWordingValues(meta)}
          />
        }
      />
    );
  },
  run: meta =>
    // $FlowFixMe
    withDevice(meta.deviceId)(() => from([meta])).pipe(
      rejectionOp(() => new CantOpenDevice()),
    ),
};

export const accountApp: Account => Step = account => ({
  Body: ({ meta }: *) => {
    const wordingValues = {
      ...inferWordingValues(meta),
      managerAppName: account.currency.managerAppName,
      currencyName: account.currency.name,
      accountName: account.name,
    };
    return (
      <RenderStep
        icon={<RoundedCurrencyIcon currency={account.currency} size={32} />}
        title={
          <Trans
            i18nKey="SelectDevice.steps.accountApp.title"
            values={wordingValues}
          />
        }
        description={
          <Trans
            i18nKey="SelectDevice.steps.accountApp.description"
            values={wordingValues}
          />
        }
      />
    );
  },
  run: meta =>
    account.id.startsWith("mock")
      ? withDevicePolling(meta.deviceId)(() =>
          from([
            {
              ...meta,
              addressInfo: { address: account.freshAddress },
            },
          ]),
        )
      : getAccountBridge(account)
          .receive(account, {
            deviceId: meta.deviceId,
          })
          .pipe(
            map(addressInfo => ({
              ...meta,
              addressInfo,
            })),
            // $FlowFixMe
            retryWhen(retryWhileErrors(genericCanRetryOnError)),
          ),
});

export const getDeviceName: Step = {
  Body: ({ meta }: *) => (
    <RenderStep
      icon={
        <DeviceNanoAction
          width={240}
          action="accept"
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
          action="accept"
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
