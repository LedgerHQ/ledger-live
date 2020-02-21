/* eslint-disable no-console */
// @flow

import fs from "fs";
import { from, empty, concat, defer, of } from "rxjs";
import {
  mergeMap,
  ignoreElements,
  catchError,
  filter,
  map
} from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import ManagerAPI from "@ledgerhq/live-common/lib/api/Manager";
import network from "@ledgerhq/live-common/lib/network";
import installApp from "@ledgerhq/live-common/lib/hw/installApp";
import uninstallApp from "@ledgerhq/live-common/lib/hw/uninstallApp";
import type {
  DeviceInfo,
  ApplicationVersion,
  Application
} from "@ledgerhq/live-common/lib/types/manager";
import { initState, reducer, runAll } from "@ledgerhq/live-common/lib/apps";
import { listApps, execWithTransport } from "@ledgerhq/live-common/lib/apps/hw";
import { delay } from "@ledgerhq/live-common/lib/promise";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { getDependencies } from "@ledgerhq/live-common/lib/apps/polyfill";
import { deviceOpt } from "../scan";
type ResultCommon = {
  versionId: number,
  appPath: string
};

type Result =
  | {
      ...ResultCommon,
      status: "OK"
    }
  | {
      ...ResultCommon,
      status: "KO",
      error: string
    };

class MemoFile {
  file: string;
  constructor(file: string) {
    this.file = file;
  }

  readResults(): Promise<Result[]> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.file, "utf8", (err, data) => {
        if (err) return reject(err);
        resolve(
          data
            .split("\n")
            .map((line: string): ?Result => {
              const [versionIdStr, appPath, status, ...rest] = line
                .split(":")
                .map(s => s.trim());
              const error = rest.join(": ");
              const versionId = parseInt(versionIdStr, 10);
              if (isNaN(versionId) || !isFinite(versionId) || versionId <= 0)
                return;
              if (versionId && appPath) {
                if (status === "OK") {
                  return {
                    versionId,
                    appPath,
                    status: "OK"
                  };
                } else if (status === "KO" && typeof error === "string") {
                  return {
                    versionId,
                    appPath,
                    status: "KO",
                    error
                  };
                }
              }
            })
            .filter(Boolean)
        );
      });
    });
  }

  writeResults(results: Result[]): Promise<void> {
    const data = results
      .map(result =>
        [
          result.versionId,
          result.appPath,
          result.status,
          result.error || ""
        ].join(": ")
      )
      .join("\n");
    return new Promise((resolve, reject) => {
      fs.writeFile(this.file, data, "utf8", err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

let results = [];
let memoFile;

type Candidate = {
  app: Application,
  version: ApplicationVersion,
  installQueue: ApplicationVersion[]
};

const getAPIDeviceVersionId = async (
  deviceInfo: DeviceInfo
): Promise<?number> => {
  const targetId = String(deviceInfo.targetId);
  const { data } = await network({
    method: "GET",
    url: `${getEnv("MANAGER_API_BASE")}/devices`
  });
  for (const device of data) {
    for (const deviceVersion of device.device_versions) {
      if (deviceVersion.target_id === targetId) {
        return deviceVersion.id;
      }
    }
  }
};

const findCandidates = async (
  deviceModel,
  applications: Application[],
  deviceInfo: DeviceInfo
): Promise<Candidate[]> => {
  const deviceVersionId = await getAPIDeviceVersionId(deviceInfo);
  if (!deviceVersionId) throw new Error("unknown device version plugged");
  const candidates = applications.flatMap(app => {
    const deps = getDependencies(app.name);
    return app.application_versions
      .filter(
        v =>
          v.providers.includes(1) &&
          v.device_versions.includes(deviceVersionId) &&
          // heuristic to see if app is compatible...
          v.firmware.startsWith(
            deviceModel.id.toLowerCase() + "/" + deviceInfo.version
          )
      )
      .map(version => {
        return {
          app,
          version,
          installQueue: [
            ...deps
              .map(name => {
                const depApp = applications.find(a => a.name === name);
                return depApp
                  ? depApp.application_versions.find(
                      v =>
                        v.providers.includes(1) && v.version === version.version
                    )
                  : null;
              })
              .filter(Boolean),
            version
          ]
        };
      });
  });

  if (process.env.RANDOM_APPS_ORDER) {
    candidates.sort(() => Math.random() - 0.5);
  }

  return candidates;
};

const installCandidate = (t, deviceInfo: DeviceInfo, candidate: Candidate) =>
  concat(
    ...candidate.installQueue.flatMap(app => [
      defer(() => delay(getEnv("MANAGER_INSTALL_DELAY"))),
      defer(() => installApp(t, deviceInfo.targetId, app))
    ])
  );

const uninstallCandidate = (t, deviceInfo: DeviceInfo, candidate: Candidate) =>
  concat(
    ...candidate.installQueue
      .slice(0)
      .reverse()
      .flatMap(app => [
        defer(() => delay(getEnv("MANAGER_INSTALL_DELAY"))),
        defer(() => uninstallApp(t, deviceInfo.targetId, app))
      ])
  );

const getCandidateName = (candidate: Candidate) => {
  return (
    candidate.version.name +
    " " +
    candidate.version.version +
    " (" +
    candidate.version.firmware +
    ")"
  );
};

const checkInstalled = (installed, candidate: Candidate) => {
  const name = getCandidateName(candidate);
  const ins = installed.find(i => i.name === candidate.version.name);
  let result;

  if (!ins) {
    console.error("FAIL " + name + " was not correctly installed");
    return empty();
  } else {
    const hashMatches = ins.hash === candidate.version.hash;
    const hasBytes = !!candidate.version.bytes;
    if (hashMatches && hasBytes) {
      result = {
        versionId: candidate.version.id,
        appPath: candidate.version.firmware,
        status: "OK"
      };
      console.log("OK " + name);
    } else {
      const message =
        (hashMatches
          ? ""
          : " have BAD HASH. API have " +
            candidate.version.hash +
            " but device have " +
            ins.hash) + (hasBytes ? "" : " DOES NOT have bytes defined!");

      result = {
        versionId: candidate.version.id,
        appPath: candidate.version.firmware,
        status: "KO",
        error: message
      };
      console.error("FAIL " + name + message);
    }
  }

  results = results
    .filter(r => r.versionId !== result.versionId)
    .concat(result);

  if (memoFile) {
    return from(memoFile.writeResults(results)).pipe(ignoreElements());
  }

  return empty();
};

const wipeAll = (t, deviceInfo) =>
  listApps(t, deviceInfo).pipe(
    filter(e => e.type === "result"),
    map(e => e.result),
    mergeMap(listAppsResult => {
      const exec = execWithTransport(t);
      let s = initState(listAppsResult);
      s = reducer(s, { type: "wipe" });
      if (s.uninstallQueue.length) {
        console.log("Uninstall " + s.uninstallQueue.length + " app(s)");
      }
      return runAll(s, exec);
    })
  );

export default {
  description:
    "install/uninstall all possible apps available on our API to check all is good (even old app versions)",
  args: [
    deviceOpt,
    {
      name: "memo",
      alias: "m",
      desc:
        "a file to memorize the previously saved result so we don't run again from the start"
    }
  ],
  job: ({ device, memo }: $Shape<{ device: string, memo: string }>) =>
    withDevice(device || "")(t => {
      // $FlowFixMe
      return from(
        Promise.all([getDeviceInfo(t), ManagerAPI.listApps()]).then(
          async ([deviceInfo, applications]) => {
            const candidates = await findCandidates(
              // $FlowFixMe
              t.deviceModel,
              applications,
              deviceInfo
            );
            let candidatesErrors = [];
            let candidatesNew = [...candidates];

            if (memo) {
              memoFile = new MemoFile(memo);
              results = await memoFile.readResults();
              candidatesErrors = [];
              candidatesNew = [];
              candidates.forEach(c => {
                const result = results.find(r => r.versionId === c.version.id);
                if (process.env.VERBOSE_CANDIDATE) {
                  console.log(
                    c.version.id,
                    c.version.firmware,
                    result
                      ? "result was " +
                          result.status +
                          (result.status === "KO" ? " " + result.error : "")
                      : ""
                  );
                }
                if (result) {
                  if (result.status === "KO") {
                    candidatesErrors.push(c);
                  }
                } else {
                  candidatesNew.push(c);
                }
              });
            }

            const all = [...candidatesNew, ...candidatesErrors];

            console.log(
              (
                (100 * (candidates.length - candidatesNew.length)) /
                candidates.length
              ).toFixed(0) +
                "% of apps versions remaining to test. (" +
                candidates.length +
                " in total. " +
                candidatesNew.length +
                " new. " +
                candidatesErrors.length +
                " errors)"
            );

            return [deviceInfo, all];
          }
        )
      ).pipe(
        mergeMap(([deviceInfo, candidates]) =>
          concat(
            wipeAll(t, deviceInfo).pipe(ignoreElements()),
            of([deviceInfo, candidates])
          )
        ),
        mergeMap(([deviceInfo, candidates]) =>
          candidates.reduce(
            (acc, candidate) =>
              concat(
                acc,
                defer(() =>
                  installCandidate(t, deviceInfo, candidate).pipe(
                    ignoreElements(),
                    catchError(e => {
                      const result = {
                        versionId: candidate.version.id,
                        appPath: candidate.version.firmware,
                        status: "KO",
                        error: "FAILED installing, got " + String(e.message)
                      };
                      results = results
                        .filter(r => r.versionId !== result.versionId)
                        .concat(result);
                      console.error(
                        "FAILED installing " + getCandidateName(candidate),
                        e
                      );
                      if (memoFile) {
                        return from(memoFile.writeResults(results)).pipe(
                          ignoreElements()
                        );
                      }
                      return empty();
                    })
                  )
                ),
                defer(() => delay(3000)).pipe(ignoreElements()),
                defer(() =>
                  from(
                    new Promise((resolve, reject) => {
                      ManagerAPI.listInstalledApps(t, {
                        targetId: deviceInfo.targetId,
                        perso: "perso_11"
                      }).subscribe({
                        next: e => {
                          if (e.type === "result") {
                            resolve(e.payload);
                          }
                        },
                        error: reject
                      });
                    })
                  ).pipe(
                    mergeMap(installed =>
                      concat(
                        checkInstalled(installed, candidate),
                        uninstallCandidate(t, deviceInfo, candidate)
                      ).pipe(ignoreElements())
                    )
                  )
                )
              ),
            empty()
          )
        )
      );
    })
};
