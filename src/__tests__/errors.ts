import { DeviceHalted, DeviceInOSUExpected } from "@ledgerhq/errors";
import { deserializeError, serializeError } from "@ledgerhq/errors";
test("DeviceHalted", () => {
  const error = new DeviceHalted();
  expect(error).toBeInstanceOf(DeviceHalted);
  const blob = serializeError(error);
  expect(blob).toMatchObject({
    name: "DeviceHalted",
  });
  const des = deserializeError(blob);
  expect(des).toBeInstanceOf(DeviceHalted);
});
test("DeviceInOSUExpected", () => {
  expect(
    deserializeError({
      name: "DeviceInOSUExpected",
    })
  ).toBeInstanceOf(DeviceInOSUExpected);
});
