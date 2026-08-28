import { DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  type ContactsModelRequirement,
  resolveContactsVersionRequirements,
} from "@ledgerhq/device-contacts-kit/api/model/ContactsVersionRequirements.js";
import {
  composeContactsGetMinVersion,
  getContactsAppMinVersion,
  getContactsOsMinVersion,
} from "./contactsMinVersion";

jest.mock("@ledgerhq/device-contacts-kit/api/model/ContactsVersionRequirements.js", () => ({
  resolveContactsVersionRequirements: jest.fn(),
}));

// These tests pin this package's own rules — the model/app guards and the
// floor composition — so they stand on a fixture rather than on the kit's real
// requirement table. The kit stays free to add models or move its floors while
// its API settles without turning that into a failure here.
const SUPPORTED_MODEL = DeviceModelId.STAX;
const UNSUPPORTED_MODEL = DeviceModelId.NANO_X;
const GATED_APP = "Ethereum";
const UNGATED_APP = "Bitcoin";
const APP_FLOOR = "1.2.3";
const OS_FLOOR = "1.5.0";

const REQUIREMENTS: Partial<Record<DeviceModelId, ContactsModelRequirement>> = {
  [SUPPORTED_MODEL]: {
    supported: true,
    minOsVersion: OS_FLOOR,
    minAppVersion: { [GATED_APP]: APP_FLOOR },
  },
  [UNSUPPORTED_MODEL]: { supported: false },
};

beforeEach(() => {
  jest
    .mocked(resolveContactsVersionRequirements)
    .mockReset()
    .mockImplementation(model => REQUIREMENTS[model] ?? { supported: false });
});

describe("getContactsAppMinVersion", () => {
  it("GIVEN a supported model and its gated app WHEN resolving THEN it returns that app's minimum version", () => {
    // WHEN
    const result = getContactsAppMinVersion(GATED_APP, SUPPORTED_MODEL);

    // THEN
    expect(result).toBe(APP_FLOOR);
  });

  it("GIVEN a supported model and an app Contacts does not gate WHEN resolving THEN it returns undefined", () => {
    // WHEN
    const result = getContactsAppMinVersion(UNGATED_APP, SUPPORTED_MODEL);

    // THEN
    expect(result).toBeUndefined();
  });

  it("GIVEN an unsupported model WHEN resolving THEN it returns undefined", () => {
    // WHEN
    const result = getContactsAppMinVersion(GATED_APP, UNSUPPORTED_MODEL);

    // THEN
    expect(result).toBeUndefined();
  });

  it("GIVEN no model WHEN resolving THEN it returns undefined without consulting the kit", () => {
    // WHEN
    const result = getContactsAppMinVersion(GATED_APP, undefined);

    // THEN
    expect(result).toBeUndefined();
    expect(resolveContactsVersionRequirements).not.toHaveBeenCalled();
  });
});

describe("getContactsOsMinVersion", () => {
  it("GIVEN a supported model WHEN resolving THEN it returns that model's minimum OS version", () => {
    // WHEN
    const result = getContactsOsMinVersion(SUPPORTED_MODEL);

    // THEN
    expect(result).toBe(OS_FLOOR);
  });

  it("GIVEN an unsupported model WHEN resolving THEN it returns undefined", () => {
    // WHEN
    const result = getContactsOsMinVersion(UNSUPPORTED_MODEL);

    // THEN
    expect(result).toBeUndefined();
  });

  it("GIVEN no model WHEN resolving THEN it returns undefined without consulting the kit", () => {
    // WHEN
    const result = getContactsOsMinVersion(undefined);

    // THEN
    expect(result).toBeUndefined();
    expect(resolveContactsVersionRequirements).not.toHaveBeenCalled();
  });
});

describe("composeContactsGetMinVersion", () => {
  it("GIVEN no injected floor WHEN composing THEN it falls back to the Contacts floor", () => {
    // GIVEN
    const getMinVersion = composeContactsGetMinVersion(undefined);

    // WHEN
    const result = getMinVersion(GATED_APP, SUPPORTED_MODEL);

    // THEN
    expect(result).toBe(APP_FLOOR);
  });

  it("GIVEN neither floor applies WHEN composing THEN it returns undefined", () => {
    // GIVEN
    const getMinVersion = composeContactsGetMinVersion(undefined);

    // WHEN
    const result = getMinVersion(UNGATED_APP, SUPPORTED_MODEL);

    // THEN
    expect(result).toBeUndefined();
  });

  it("GIVEN only an injected floor and no Contacts floor for that app WHEN composing THEN it returns the injected floor", () => {
    // GIVEN
    const getMinVersion = composeContactsGetMinVersion(() => "1.10.0");

    // WHEN
    const result = getMinVersion(UNGATED_APP, SUPPORTED_MODEL);

    // THEN
    expect(result).toBe("1.10.0");
  });

  it("GIVEN an injected floor lower than the Contacts floor WHEN composing THEN it returns the Contacts floor", () => {
    // GIVEN
    const getMinVersion = composeContactsGetMinVersion(() => "0.0.1");

    // WHEN
    const result = getMinVersion(GATED_APP, SUPPORTED_MODEL);

    // THEN
    expect(result).toBe(APP_FLOOR);
  });

  it("GIVEN an injected floor higher than the Contacts floor WHEN composing THEN it returns the injected floor", () => {
    // GIVEN
    const getMinVersion = composeContactsGetMinVersion(() => "999.0.0");

    // WHEN
    const result = getMinVersion(GATED_APP, SUPPORTED_MODEL);

    // THEN
    expect(result).toBe("999.0.0");
  });

  it("GIVEN an injected floor equal to the Contacts floor WHEN composing THEN it returns that floor", () => {
    // GIVEN
    const getMinVersion = composeContactsGetMinVersion(() => APP_FLOOR);

    // WHEN
    const result = getMinVersion(GATED_APP, SUPPORTED_MODEL);

    // THEN
    expect(result).toBe(APP_FLOOR);
  });

  it("GIVEN an injected floor WHEN composing THEN it forwards the app and model to it", () => {
    // GIVEN
    const getLiveConfigMinVersion = jest.fn(() => "0.0.1");
    const getMinVersion = composeContactsGetMinVersion(getLiveConfigMinVersion);

    // WHEN
    getMinVersion(GATED_APP, SUPPORTED_MODEL);

    // THEN
    expect(getLiveConfigMinVersion).toHaveBeenCalledWith(GATED_APP, SUPPORTED_MODEL);
  });
});
