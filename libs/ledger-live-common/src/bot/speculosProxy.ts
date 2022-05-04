import network from "../network";
import SpeculosTransportProxy from "./SpeculosTransportProxy";
import { registerTransportModule } from "../hw";
import type { DeviceModelId } from "@ledgerhq/devices";
import { getEnv } from "../env";

const data = {};

const getSpeculosWs = () => getEnv("SPECULOS_SERVICE_WS");
const getSpeculosHttp = () => getEnv("SPECULOS_SERVICE_HTTP");

const createTransport = async (id: string) => {
  const transport = await SpeculosTransportProxy.open(
    `${getSpeculosWs()}/${id}`
  );

  data[id] = {
    transport,
    destroy: () => {
      if (!data[id]) return;
      data[id].transport.close();
      delete data[id];
    },
  };

  return transport;
};

export type AppCandidate = {
  path: string;
  model: DeviceModelId;
  firmware: string;
  appName: string;
  appVersion: string;
};

export const findAppCandidate = async (appQuery: any): Promise<any> => {
  return (
    await network({
      method: "POST",
      url: `${getSpeculosHttp()}/app-candidate`,
      data: { ...appQuery, token: getEnv("BOT_SPECULOS_PROXY_TOKEN") },
    })
  ).data;
};

export const createSpeculosDevice = async (deviceParams: any): Promise<any> => {
  const res = (
    await network({
      method: "POST",
      url: `${getSpeculosHttp()}/`,
      data: { ...deviceParams, token: getEnv("BOT_SPECULOS_PROXY_TOKEN") },
    })
  ).data;

  return { id: res.id, transport: await createTransport(res.id) };
};

export const releaseSpeculosDevice = async (id: string): Promise<any> => {
  await network({
    method: "DELETE",
    url: `${getSpeculosHttp()}/${id}`,
    body: { token: getEnv("BOT_SPECULOS_PROXY_TOKEN") },
  });

  const obj = data[id];

  if (obj) {
    await obj.destroy();
  }
};

registerTransportModule({
  id: "speculos",
  open: (id): Promise<any> | null | undefined => {
    if (!id) return;

    if (id.startsWith("speculosID")) {
      const obj = data[id];

      if (!obj) {
        throw new Error("speculos transport was destroyed");
      }

      return Promise.resolve(obj.transport);
    }
  },
  close: (transport, id) => {
    if (id.startsWith("speculos")) {
      return Promise.resolve();
    } // todo close the speculos: case
  },
  disconnect: releaseSpeculosDevice,
});
