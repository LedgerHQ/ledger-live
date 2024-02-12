import { FirmwareNotRecognized } from "@ledgerhq/errors";
import Manager from "../manager/api";
import "./test-helpers/setup";
describe("getDeviceVersion", () => {
  test("it works with a 1.5.5", async () => {
    const res = await Manager.getDeviceVersion(823132164, 1);
    expect(res).toMatchObject({
      target_id: "823132164",
    });
    expect(res.id).toBeDefined();
    expect(res.name).toBeDefined();
    expect(res.display_name).toBeDefined();
    expect(res.target_id).toBeDefined();
    expect(res.description).toBeDefined();
    expect(res.device).toBeDefined();
    expect(res.providers).toBeDefined();
    expect(res.mcu_versions).toBeDefined();
    expect(res.se_firmware_final_versions).toBeDefined();
    expect(res.osu_versions).toBeDefined();
    expect(res.application_versions).toBeDefined();
    expect(res.date_creation).toBeDefined();
    expect(res.date_last_modified).toBeDefined();
  });
  test("it throw FirmwareNotRecognized with dumb data", async () => {
    const r = await Manager.getDeviceVersion(42, 1).then(
      () => null,
      e => e,
    );
    expect(r).toBeDefined();
    expect(r).toBeInstanceOf(FirmwareNotRecognized);
  });
});
