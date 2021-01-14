// @flow

import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import last from "lodash/last";
import { Trans, useTranslation } from "react-i18next";
import { from, of } from "rxjs";
import { map, first, retryWhen } from "rxjs/operators";
import { useNavigation } from "@react-navigation/native";
import type {
  CryptoCurrency,
  Account,
  Transaction,
} from "@ledgerhq/live-common/lib/types";
import { getDeviceModel } from "@ledgerhq/devices";
import getAddress from "@ledgerhq/live-common/lib/hw/getAddress";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { CantOpenDevice } from "@ledgerhq/errors";
import {
  getDerivationScheme,
  runDerivationScheme,
  getDerivationModesForCurrency,
} from "@ledgerhq/live-common/lib/derivation";
import {
  withDevice,
  withDevicePolling,
  retryWhileErrors,
  genericCanRetryOnError,
} from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import getDeviceNameTransport from "@ledgerhq/live-common/lib/hw/getDeviceName";
import editDeviceNameTransport from "@ledgerhq/live-common/lib/hw/editDeviceName";
import checkDeviceForManager from "@ledgerhq/live-common/lib/hw/checkDeviceForManager";
import { listApps as listAppsTransport } from "@ledgerhq/live-common/lib/apps/hw";
import { initSwap } from "@ledgerhq/live-common/lib/exchange/swap";
import type {
  Exchange,
  ExchangeRate,
} from "@ledgerhq/live-common/lib/exchange/swap/types";
import type { SocketEvent } from "@ledgerhq/live-common/lib/types/manager";
import BluetoothScanning from "../BluetoothScanning";
import DeviceNanoAction from "../DeviceNanoAction";
import Spinning from "../Spinning";
import LiveLogo from "../../icons/LiveLogoIcon";
import Button from "../Button";
import RoundedCurrencyIcon from "../RoundedCurrencyIcon";
import { rejectionOp } from "../DebugRejectSwitch";
import { ScreenName } from "../../const";
import LText from "../LText";

import type { Step } from "./types";
import { RenderStep } from "./StepRenders";
import DisplayAddress from "../DisplayAddress";

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
          values={inferWordingValues(meta)}
        />
      }
    />
  ),
  run: meta =>
    // $FlowFixMe
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
  Body: ({ meta, colors }: *) =>
    meta.genuineAskedOnDevice ? (
      <RenderStep
        icon={
          <DeviceNanoAction
            screen="validation"
            action="accept"
            modelId={meta.modelId}
            wired={meta.wired}
          />
        }
        title={
          <Trans
            i18nKey="SelectDevice.steps.genuineCheck.title"
            values={inferWordingValues(meta)}
          />
        }
      />
    ) : (
      <RenderStep
        icon={
          <Spinning>
            <LiveLogo size={32} color={colors.grey} />
          </Spinning>
        }
        title={<Trans i18nKey="SelectDevice.steps.genuineCheckPending.title" />}
      />
    ),
  run: meta =>
    withDevice(meta.deviceId)(transport =>
      checkDeviceForManager(transport, meta.deviceInfo),
    ).pipe(
      map((e: SocketEvent) => {
        if (e.type === "result") {
          return {
            ...meta,
            genuineResult: e.payload,
          };
        }
        return {
          ...meta,
          genuineAskedOnDevice: e.type === "allow-manager-requested",
        };
      }),
    ),
};

export const listApps: Step = {
  Body: ({ meta, colors }: *) =>
    meta.allowManagerRequested ? (
      <RenderStep
        icon={
          <DeviceNanoAction
            screen="validation"
            action="accept"
            modelId={meta.modelId}
            wired={meta.wired}
          />
        }
        title={
          <Trans
            i18nKey="SelectDevice.steps.genuineCheck.title"
            values={inferWordingValues(meta)}
          />
        }
      />
    ) : (
      <RenderStep
        icon={
          <Spinning>
            <LiveLogo size={32} color={colors.grey} />
          </Spinning>
        }
        title={<Trans i18nKey="SelectDevice.steps.listApps.title" />}
      />
    ),
  run: meta =>
    withDevice(meta.deviceId)(transport =>
      listAppsTransport(transport, meta.deviceInfo),
    ).pipe(
      map((e: *) => ({
        ...meta,
        ...(e.type === "result" ? { appRes: e.result } : {}),
        allowManagerRequested: e.type === "device-permission-requested",
      })),
    ),
};

export const currencyApp: CryptoCurrency => Step = currency => ({
  Body: ({ meta, onClose, colors }: *) => {
    const { t } = useTranslation();
    const navigation = useNavigation();

    const goManager = useCallback(() => {
      if (onClose) {
        onClose();
      }

      navigation.navigate(ScreenName.Manager);
    }, [onClose, navigation]);

    const wordingValues = {
      ...inferWordingValues(meta),
      managerAppName: currency.managerAppName,
      currencyName: currency.name,
    };

    return (
      <RenderStep
        icon={<RoundedCurrencyIcon currency={currency} size={32} />}
        title={
          <Trans
            i18nKey="SelectDevice.steps.currencyApp.title"
            values={wordingValues}
          />
        }
        description={
          <Trans
            i18nKey="SelectDevice.steps.currencyApp.description"
            values={wordingValues}
          />
        }
      >
        <View style={[styles.footer, { borderColor: colors.lightFog }]}>
          <LText secondary semiBold style={styles.appInstalled}>
            {t("SelectDevice.steps.currencyApp.footer.appInstalled")}
          </LText>
          <Button
            title={t("SelectDevice.steps.currencyApp.footer.goManager")}
            onPress={goManager}
            event="DeviceJobGoToManager"
            type="secondary"
          />
        </View>
      </RenderStep>
    );
  },
  run: meta =>
    // $FlowFixMe
    withDevicePolling(meta.deviceId)(transport => {
      if (meta.deviceId.startsWith("mock")) {
        return of({
          ...meta,
          addressInfo: { address: "" },
        });
      }

      const derivationMode = last(getDerivationModesForCurrency(currency));

      return from(
        getAddress(transport, {
          currency,
          derivationMode,
          path: runDerivationScheme(
            getDerivationScheme({ currency, derivationMode }),
            currency,
          ),
        }),
      );
    }).pipe(
      map(addressInfo => ({
        ...meta,
        addressInfo,
      })),
      rejectionOp(() => new CantOpenDevice()),
    ),
});

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    alignItems: "stretch",
    padding: 16,
  },
  appInstalled: {
    fontSize: 16,
    paddingVertical: 16,
    textAlign: "center",
  },
});

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

export const verifyAddressOnDeviceStep: Account => Step = account => ({
  Body: ({ meta }: *) => (
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
      <DisplayAddress address={account.freshAddress} verified={false} />
    </RenderStep>
  ),

  run: meta =>
    getAccountBridge(account)
      .receive(account, {
        deviceId: meta.deviceId,
        verify: true,
      })
      .pipe(
        map(addressInfo => addressInfo),
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

export const initSwapStep: ({
  exchange: Exchange,
  exchangeRate: ExchangeRate,
  transaction: Transaction,
}) => Step = ({ exchange, exchangeRate, transaction }) => ({
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
      title={<Trans i18nKey="transfer.swap.form.validate" />}
    />
  ),

  run: meta => initSwap(exchange, exchangeRate, transaction, meta.deviceId),
});
