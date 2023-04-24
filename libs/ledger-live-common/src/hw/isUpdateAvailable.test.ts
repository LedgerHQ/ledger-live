import isUpdateAvailable from "./isUpdateAvailable";
import { deviceInfo155, deviceInfo202 } from "../apps/mock";
import { AppAndVersion } from "../hw/connectApp";

describe("isUpdateAvailable tests", () => {
  const scenarios = [
    {
      name: "Old device, outdated app expects no update, needs fw update",
      deviceInfo: deviceInfo155,
      expectedResult: false,
      outdatedApp: {
        name: "Ethereum",
        version: "1.0.0",
        flags: 0,
      },
    },
    {
      name: "Old device, up-to-date app expect no update",
      deviceInfo: deviceInfo155,
      expectedResult: false,
      outdatedApp: {
        name: "Ethereum",
        version: "1.0.0",
        flags: 0,
      },
    },
    {
      name: "New device, outdated app expects an update",
      deviceInfo: deviceInfo202,
      expectedResult: true,
      outdatedApp: {
        name: "Ethereum",
        version: "1.9.0",
      },
    },
  ];

  // We part from the fact that we are only calling this when we know the currently
  // installed application does not meet the minimum so we don't really need more cases
  // to cover.
  scenarios.forEach(({ name, deviceInfo, outdatedApp, expectedResult }) => {
    it(name, async () => {
      jest.mock("../manager/api");
      // I don't know how to avoid the internal API calls to the Manager API.
      const result = await isUpdateAvailable(
        deviceInfo,
        outdatedApp as AppAndVersion
      );
      expect(result).toBe(expectedResult);
    });
  });
});
