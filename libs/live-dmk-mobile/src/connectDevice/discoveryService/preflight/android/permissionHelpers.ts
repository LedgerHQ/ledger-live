import { PermissionsAndroid, type Permission, type PermissionStatus } from "react-native";
import type { MobileDiscoveryError } from "../../../types";
import {
  mapDiscoveryErrorToPreflightResult,
  successPreflightResult,
  type DiscoveryPreflightResult,
} from "../preflightResult";

const { RESULTS } = PermissionsAndroid;

export const DEFAULT_PERMISSION_REQUEST_TIMEOUT_MS = 10_000;
export const shouldUseManualActionForPermissionDenial = true;

type PermissionRequestStatuses = Partial<Record<Permission, PermissionStatus>>;

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
  const requestResult = await withPermissionRequestTimeout<PermissionRequestStatuses>(
    PermissionsAndroid.requestMultiple(permissions),
    getPermissionRequestTimeoutStatuses(permissions),
  );
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
  const status = await withPermissionRequestTimeout(
    PermissionsAndroid.request(permission),
    RESULTS.NEVER_ASK_AGAIN,
  );

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
    shouldUseManualActionForPermissionDenial || requestResult.neverAskAgain
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

/**
 * TODO(LIVE-23757): This workaround for never resolving permission request
 * can be removed once React Native is upgraded to 0.81.6
 */
const withPermissionRequestTimeout = async <T>(
  request: Promise<T>,
  timeoutValue: T,
  timeoutMs = DEFAULT_PERMISSION_REQUEST_TIMEOUT_MS,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>(resolve => {
    timeoutId = setTimeout(() => resolve(timeoutValue), timeoutMs);
  });

  try {
    return await Promise.race([request, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const getPermissionRequestTimeoutStatuses = (
  permissions: Permission[],
): PermissionRequestStatuses => {
  const statuses: PermissionRequestStatuses = {};

  permissions.forEach(permission => {
    statuses[permission] = RESULTS.NEVER_ASK_AGAIN;
  });

  return statuses;
};
