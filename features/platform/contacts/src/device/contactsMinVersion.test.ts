import { DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  composeContactsGetMinVersion,
  getContactsAppMinVersion,
  getContactsOsMinVersion,
} from "./contactsMinVersion";

describe("getContactsAppMinVersion", () => {
  it("GIVEN a supported model and its gated app WHEN resolving THEN it returns that app's minimum version", () => {
    // WHEN
    const result = getContactsAppMinVersion("Ethereum", DeviceModelId.STAX);

    // THEN
    expect(result).toBeDefined();
  });

  it("GIVEN a supported model and an app Contacts does not gate WHEN resolving THEN it returns undefined", () => {
    // WHEN
    const result = getContactsAppMinVersion("Bitcoin", DeviceModelId.STAX);

    // THEN
    expect(result).toBeUndefined();
  });

  it("GIVEN an unsupported model WHEN resolving THEN it returns undefined", () => {
    // WHEN
    const result = getContactsAppMinVersion("Ethereum", DeviceModelId.NANO_X);

    // THEN
    expect(result).toBeUndefined();
  });

  it("GIVEN no model WHEN resolving THEN it returns undefined", () => {
    // WHEN
    const result = getContactsAppMinVersion("Ethereum", undefined);

    // THEN
    expect(result).toBeUndefined();
  });
});

describe("getContactsOsMinVersion", () => {
  it("GIVEN a supported model WHEN resolving THEN it returns that model's minimum OS version", () => {
    // WHEN
    const result = getContactsOsMinVersion(DeviceModelId.FLEX);

    // THEN
    expect(result).toBeDefined();
  });

  it("GIVEN an unsupported model WHEN resolving THEN it returns undefined", () => {
    // WHEN
    const result = getContactsOsMinVersion(DeviceModelId.NANO_S);

    // THEN
    expect(result).toBeUndefined();
  });

  it("GIVEN no model WHEN resolving THEN it returns undefined", () => {
    // WHEN
    const result = getContactsOsMinVersion(undefined);

    // THEN
    expect(result).toBeUndefined();
  });
});

describe("composeContactsGetMinVersion", () => {
  it("GIVEN no injected floor WHEN composing THEN it falls back to the Contacts floor", () => {
    // GIVEN
    const getMinVersion = composeContactsGetMinVersion(undefined);

    // WHEN
    const result = getMinVersion("Ethereum", DeviceModelId.STAX);

    // THEN
    expect(result).toBe(getContactsAppMinVersion("Ethereum", DeviceModelId.STAX));
  });

  it("GIVEN only an injected floor and no Contacts floor for that app WHEN composing THEN it returns the injected floor", () => {
    // GIVEN
    const getMinVersion = composeContactsGetMinVersion(() => "1.10.0");

    // WHEN
    const result = getMinVersion("Bitcoin", DeviceModelId.STAX);

    // THEN
    expect(result).toBe("1.10.0");
  });

  it("GIVEN an injected floor lower than the Contacts floor WHEN composing THEN it returns the Contacts floor", () => {
    // GIVEN
    const contactsFloor = getContactsAppMinVersion("Ethereum", DeviceModelId.STAX);
    const getMinVersion = composeContactsGetMinVersion(() => "0.0.1");

    // WHEN
    const result = getMinVersion("Ethereum", DeviceModelId.STAX);

    // THEN
    expect(result).toBe(contactsFloor);
  });

  it("GIVEN an injected floor higher than the Contacts floor WHEN composing THEN it returns the injected floor", () => {
    // GIVEN
    const getMinVersion = composeContactsGetMinVersion(() => "999.0.0");

    // WHEN
    const result = getMinVersion("Ethereum", DeviceModelId.STAX);

    // THEN
    expect(result).toBe("999.0.0");
  });
});
