import semver from "semver";
import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import type { HandlerDeps } from "../types";

export function createDeviceTransportHandler(getDeps: () => HandlerDeps): WalletHandlers["device.transport"] {
  return ({ appName, appVersionRange, devices }) =>
    new Promise((resolve, reject) => {
      const { uiDeviceTransport, device, tracking, manifest } = getDeps();
      if (!uiDeviceTransport) {
        reject(new Error("device.transport UI handler not configured"));
        return;
      }

      if (device.ref.current) {
        return reject(new Error("Device already opened"));
      }

      tracking.deviceTransportRequested(manifest);

      let done = false;
      return uiDeviceTransport({
        appName,
        onSuccess: ({ device: deviceParam, appAndVersion }) => {
          if (done) return;
          done = true;
          tracking.deviceTransportSuccess(manifest);

          if (!deviceParam) {
            reject(new Error("No device"));
            return;
          }
          if (devices && !devices.includes(deviceParam.modelId)) {
            reject(new Error("Device not in the devices list"));
            return;
          }
          if (
            appVersionRange &&
            appAndVersion &&
            semver.satisfies(appAndVersion.version, appVersionRange)
          ) {
            reject(new Error("App version doesn't satisfies the range"));
            return;
          }
          device.subscribe(deviceParam.deviceId);
          resolve("1");
        },
        onCancel: () => {
          if (done) return;
          done = true;
          tracking.deviceTransportFail(manifest);
          reject(new Error("User cancelled"));
        },
      });
    });
}

export function createDeviceSelectHandler(getDeps: () => HandlerDeps): WalletHandlers["device.select"] {
  return ({ appName, appVersionRange, devices }) =>
    new Promise((resolve, reject) => {
      const { uiDeviceSelect, device, tracking, manifest } = getDeps();
      if (!uiDeviceSelect) {
        reject(new Error("device.select UI handler not configured"));
        return;
      }

      if (device.ref.current) {
        return reject(new Error("Device already opened"));
      }

      tracking.deviceSelectRequested(manifest);

      let done = false;
      return uiDeviceSelect({
        appName,
        onSuccess: ({ device: deviceParam, appAndVersion }) => {
          if (done) return;
          done = true;
          tracking.deviceSelectSuccess(manifest);

          if (!deviceParam) {
            reject(new Error("No device"));
            return;
          }
          if (devices && !devices.includes(deviceParam.modelId)) {
            reject(new Error("Device not in the devices list"));
            return;
          }
          if (
            appVersionRange &&
            appAndVersion &&
            semver.satisfies(appAndVersion.version, appVersionRange)
          ) {
            reject(new Error("App version doesn't satisfies the range"));
            return;
          }
          resolve(deviceParam.deviceId);
        },
        onCancel: () => {
          if (done) return;
          done = true;
          tracking.deviceSelectFail(manifest);
          reject(new Error("User cancelled"));
        },
      });
    });
}

export function createDeviceOpenHandler(getDeps: () => HandlerDeps) {
  return (params) => {
    const { device, tracking, manifest } = getDeps();

    if (device.ref.current) {
      return Promise.reject(new Error("Device already opened"));
    }

    tracking.deviceOpenRequested(manifest);

    device.subscribe(params.deviceId);
    return "1";
  };
}

export function createDeviceExchangeHandler(getDeps: () => HandlerDeps) {
  return (params) => {
    const { device, tracking, manifest } = getDeps();

    if (!device.ref.current) {
      return Promise.reject(new Error("No device opened"));
    }

    tracking.deviceExchangeRequested(manifest);

    return device.exchange(params);
  };
}

export function createDeviceCloseHandler(getDeps: () => HandlerDeps) {
  return ({ transportId }) => {
    const { device, tracking, manifest } = getDeps();

    if (!device.ref.current) {
      return Promise.reject(new Error("No device opened"));
    }

    tracking.deviceCloseRequested(manifest);
    device.close();
    tracking.deviceCloseSuccess(manifest);

    return Promise.resolve(transportId);
  };
}
