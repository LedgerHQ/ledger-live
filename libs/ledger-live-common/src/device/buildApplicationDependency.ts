import {
  type ApplicationConstraint,
  type ApplicationDependency,
  type ApplicationVersionConstraint,
  DeviceModelId,
} from "@ledgerhq/device-management-kit";
import semver from "semver";

export type GetMinVersion = (appName: string, model?: DeviceModelId) => string | undefined;

function isApplicationVersionConstraint(version: string): version is ApplicationVersionConstraint {
  return (
    version === "latest" || /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)
  );
}

/**
 * Widens a release floor so prerelease builds of that same version satisfy it:
 * `1.23.0` becomes `1.23.0-0`.
 *
 * Constraints are checked against the version the device reports with a raw
 * `semver.gte`, which ranks `1.23.0-dev` below `1.23.0`, so a `-dev` or `-rc`
 * build of the required version would be rejected outright. Lowering the floor
 * to just under the release keeps the version ordering itself intact, so
 * `1.22.9-dev` is still rejected — unlike coercing the device version, which
 * would also let `1.23.0-rc1` satisfy a `1.23.0-rc2` floor.
 *
 * A floor that already names a prerelease is its own answer and is left alone,
 * as is `latest`, which the kit resolves against the catalog rather than by
 * comparison.
 */
function toPrereleaseTolerantMinVersion(
  minVersion: ApplicationVersionConstraint,
): ApplicationVersionConstraint {
  if (minVersion === "latest") return minVersion;

  const parsed = semver.parse(minVersion);
  if (parsed === null || parsed.prerelease.length > 0) return minVersion;

  return `${parsed.major}.${parsed.minor}.${parsed.patch}-0`;
}

/**
 * Builds the per-device-model version constraints for one application, from
 * the app-global version floors the host supplies.
 */
export function buildApplicationDependency(
  appName: string,
  getMinVersion: GetMinVersion,
): ApplicationDependency {
  const constraints = Object.values(DeviceModelId).reduce<ApplicationConstraint[]>(
    (result, model) => {
      const minVersion = getMinVersion(appName, model);

      if (!minVersion || !isApplicationVersionConstraint(minVersion)) {
        return result;
      }

      result.push({
        minVersion: toPrereleaseTolerantMinVersion(minVersion),
        applicableModels: [model],
      });

      return result;
    },
    [],
  );

  return {
    name: appName,
    constraints,
  };
}
