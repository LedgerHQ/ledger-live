import type { DeviceModelId } from "@ledgerhq/device-management-kit";
// Imported through the kit's lightweight model subpath, not its package root,
// so pulling this pure version table doesn't drag in the ContactsManager's
// APDU/DI graph.
import { resolveContactsVersionRequirements } from "@ledgerhq/device-contacts-kit/api/model/ContactsVersionRequirements.js";
import semver from "semver";

/**
 * Shape of the app-global `getMinVersion` this package composes with, kept as
 * a local structural type instead of importing it from legacy `libs/*`.
 */
export type ContactsGetMinVersion = (appName: string, model?: DeviceModelId) => string | undefined;

/**
 * Minimum coin-app version required for Contacts app-owned operations on the
 * given device model, straight from the kit's static version-requirement
 * table. Returns `undefined` when the model is unsupported or the app isn't
 * gated by Contacts.
 */
export function getContactsAppMinVersion(
  appName: string,
  model?: DeviceModelId,
): string | undefined {
  if (model === undefined) return undefined;
  const requirement = resolveContactsVersionRequirements(model);
  return requirement.supported ? requirement.minAppVersion[appName] : undefined;
}

/**
 * Minimum OS version required for Contacts OS-owned operations (dashboard
 * contact rename) on the given device model.
 */
export function getContactsOsMinVersion(model?: DeviceModelId): string | undefined {
  if (model === undefined) return undefined;
  const requirement = resolveContactsVersionRequirements(model);
  return requirement.supported ? requirement.minOsVersion : undefined;
}

/**
 * Composes the host's app-global version floor with the Contacts kit's own
 * app floor, keeping the greater of the two. Never replaces the app-global
 * floor: a caller that supplies none still gets the Contacts floor enforced.
 *
 * This also holds when `getLiveConfigMinVersion` is a real function that
 * itself returns `undefined` (e.g. the host's `getMinVersion` bypassing
 * `DISABLE_APP_VERSION_REQUIREMENTS`): that flag disables the live-config
 * policy gate, not the Contacts kit's own hardware/protocol requirement,
 * so the Contacts floor still applies.
 */
export function composeContactsGetMinVersion(
  getLiveConfigMinVersion: ContactsGetMinVersion | undefined,
): ContactsGetMinVersion {
  return (appName, model) => {
    const liveConfigFloor = getLiveConfigMinVersion?.(appName, model);
    const contactsFloor = getContactsAppMinVersion(appName, model);

    if (liveConfigFloor === undefined) return contactsFloor;
    if (contactsFloor === undefined) return liveConfigFloor;

    return semver.gte(liveConfigFloor, contactsFloor) ? liveConfigFloor : contactsFloor;
  };
}
