import { pushDevicesApi, pushDevicesApiExtra } from "./api";
import { pushDevicesService } from "./service";

const common = { ledgerClientVersion: "test" };
const own = { pushDevicesServiceUrl: "https://push-devices.test" };

describe("pushDevicesService", () => {
  it("registers the Push Devices api", () => {
    expect(pushDevicesService(() => own).api).toBe(pushDevicesApi);
  });

  it("builds the same extraArgument as pushDevicesApiExtra, with the common config", () => {
    expect(pushDevicesService(() => own).buildExtra(common)).toEqual(
      pushDevicesApiExtra({ ...own, ...common }),
    );
  });
});
