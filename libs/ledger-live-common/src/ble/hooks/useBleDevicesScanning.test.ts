import { useBleDevicesScanning } from "./useBleDevicesScanning";

describe("useBleDevicesScanning", () => {
  describe("When filterModelIds is not null", () => {
    test.todo("should filter the scanning result by the given model ids");
  });

  describe("When filterOutDeviceIds is not null", () => {
    test.todo(
      "should filter out the associated devices from the scanning result"
    );
  });

  describe("When the scanning reached the timeout without any result", () => {
    test.todo("should return an error ?");
  });
});
