import { PermissionsAndroid, type Permission } from "react-native";
import type { MobileDiscoveryError } from "../../../types";
import {
  mapDiscoveryErrorToPreflightResult,
  successPreflightResult,
  type DiscoveryPreflightResult,
} from "../preflightResult";

const { RESULTS } = PermissionsAndroid;

export type PermissionRequestResult = {
  granted: boolean;
  neverAskAgain: boolean;
  deniedPermissions: Permission[];
};

type PermissionPreflightConfig = {
  permissions: Permission[];
  retry: () => Promise<true | MobileDiscoveryError>;
  buildPromptableError: (
    permissions: Permission[],
    retry: () => Promise<true | MobileDiscoveryError>,
  ) => MobileDiscoveryError;
  buildManualSettingsError: (
    permissions: Permission[],
    retry: () => Promise<true | MobileDiscoveryError>,
  ) => MobileDiscoveryError;
};

export const requestPermissions = async (
  permissions: Permission[],
): Promise<PermissionRequestResult> => {
  const requestResult = await PermissionsAndroid.requestMultiple(permissions);
  const deniedPermissions = permissions.filter(
    permission => requestResult[permission] !== RESULTS.GRANTED,
  );

  return {
    granted: deniedPermissions.length === 0,
    neverAskAgain: permissions.some(
      permission => requestResult[permission] === RESULTS.NEVER_ASK_AGAIN,
    ),
    deniedPermissions,
  };
};

export const requestPermission = async (
  permission: Permission,
): Promise<PermissionRequestResult> => {
  const status = await PermissionsAndroid.request(permission);

  return {
    granted: status === RESULTS.GRANTED,
    neverAskAgain: status === RESULTS.NEVER_ASK_AGAIN,
    deniedPermissions: status === RESULTS.GRANTED ? [] : [permission],
  };
};

export const runPermissionPreflight = async (
  config: PermissionPreflightConfig,
): Promise<DiscoveryPreflightResult> => {
  const { permissions } = config;

  if (permissions.length === 0) {
    return successPreflightResult;
  }

  const missingPermissions = await getMissingPermissions(permissions);

  if (missingPermissions.length === 0) {
    return successPreflightResult;
  }

  const requestResult =
    missingPermissions.length === 1
      ? await requestPermission(missingPermissions[0])
      : await requestPermissions(missingPermissions);

  if (requestResult.granted) {
    return successPreflightResult;
  }

  return mapDiscoveryErrorToPreflightResult(
    requestResult.neverAskAgain
      ? config.buildManualSettingsError(requestResult.deniedPermissions, config.retry)
      : config.buildPromptableError(requestResult.deniedPermissions, config.retry),
  );
};

const getMissingPermissions = async (permissions: Permission[]): Promise<Permission[]> => {
  const results = await Promise.all(
    permissions.map(async permission => ({
      permission,
      granted: await PermissionsAndroid.check(permission),
    })),
  );

  return results.filter(({ granted }) => !granted).map(({ permission }) => permission);
};
