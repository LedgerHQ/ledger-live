import {
  createSpeculosDevice,
  findAppCandidate,
  releaseSpeculosDevice,
} from "./speculosProxy";

export const getAppCandidate = async (appQuery, specName) => {
  const appCandidate = await findAppCandidate(appQuery);
  if (!appCandidate) {
    console.warn("no app found for " + specName, {
      appQuery,
    });
  }

  return appCandidate;
};

export const createEngineTransport = async (deviceParams) => {
  return await createSpeculosDevice(deviceParams);
};

export const releaseEngineTransport = async (id: string) => {
  return await releaseSpeculosDevice(id);
};
