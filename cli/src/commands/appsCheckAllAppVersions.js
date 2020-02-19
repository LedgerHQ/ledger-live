/* eslint-disable no-console */
// @flow

import { from, empty, concat, defer } from "rxjs";
import { mergeMap, ignoreElements, catchError } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import ManagerAPI from "@ledgerhq/live-common/lib/api/Manager";
import { listApps } from "@ledgerhq/live-common/lib/apps/hw";
import installApp from "@ledgerhq/live-common/lib/hw/installApp";
import uninstallApp from "@ledgerhq/live-common/lib/hw/uninstallApp";
import type {
  DeviceInfo,
  ApplicationVersion,
  Application
} from "@ledgerhq/live-common/lib/types/manager";
import { delay } from "@ledgerhq/live-common/lib/promise";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { getDependencies } from "@ledgerhq/live-common/lib/apps/polyfill";
import { deviceOpt } from "../scan";

type Candidate = {
  app: Application,
  version: ApplicationVersion,
  installQueue: ApplicationVersion[]
};

const findCandidates = (
  deviceModel,
  applications: Application[],
  deviceInfo: DeviceInfo
): Candidate[] => {
  const candidates = applications.flatMap(app => {
    const deps = getDependencies(app.name);
    return app.application_versions
      .filter(
        v =>
          v.providers.includes(1) &&
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
  if (!ins) {
    console.error("FAIL " + name + " was not correctly installed");
    return;
  }
  const hashMatches = ins.hash === candidate.version.hash;
  const hasBytes = !!candidate.version.bytes;
  if (hashMatches && hasBytes) {
    console.log("OK " + name);
  } else {
    console.error(
      "FAIL " +
        name +
        (hashMatches
          ? ""
          : " have BAD HASH: API have " +
            candidate.version.hash +
            " but device have " +
            ins.hash) +
        (hasBytes ? "" : " DOES NOT have bytes defined!")
    );
  }
};

export default {
  description:
    "install/uninstall all possible apps available on our API to check all is good (even old app versions)",
  args: [deviceOpt],
  job: ({ device }: $Shape<{ device: string }>) =>
    withDevice(device || "")(t => {
      // $FlowFixMe
      return from(Promise.all([getDeviceInfo(t), ManagerAPI.listApps()])).pipe(
        mergeMap(([deviceInfo, applications]) =>
          // $FlowFixMe
          findCandidates(t.deviceModel, applications, deviceInfo).reduce(
            (acc, candidate) =>
              concat(
                acc,
                defer(() =>
                  installCandidate(t, deviceInfo, candidate).pipe(
                    ignoreElements(),
                    catchError(e => {
                      console.error(
                        "FAILED installing " + getCandidateName(candidate),
                        e
                      );
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
                    mergeMap(installed => {
                      checkInstalled(installed, candidate);
                      return uninstallCandidate(t, deviceInfo, candidate).pipe(
                        ignoreElements()
                      );
                    })
                  )
                )
              ),
            empty()
          )
        )
      );
    })
};
