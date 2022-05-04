import { getEnv } from "../env";
import invariant from "invariant";
import {
  createSpeculosDevice,
  findAppCandidate,
  listAppCandidates,
  releaseSpeculosDevice,
} from "../load/speculos";

let appCandidates;

export const getAppCandidate = async (appQuery, specName) => {
  const coinapps = getEnv("COINAPPS");
  invariant(coinapps, "COINAPPS is not set");
  const seed = getEnv("SEED");
  invariant(seed, "SEED is not set");

  if (!appCandidates) {
    appCandidates = await listAppCandidates(coinapps);
  }

  const appCandidate = findAppCandidate(appCandidates, appQuery);
  if (!appCandidate) {
    console.warn("no app found for " + specName, { appQuery, appCandidates });
  }

  invariant(
    appCandidate,
    "%s: no app found. Are you sure your COINAPPS is up to date?",
    specName,
    coinapps
  );

  return appCandidate;
};

export const createEngineTransport = async (deviceParams) => {
  return await createSpeculosDevice(deviceParams);
};

export const releaseEngineTransport = async (id: string) => {
  return await releaseSpeculosDevice(id);
};
