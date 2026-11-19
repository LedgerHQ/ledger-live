import { DeviceModelId } from "@ledgerhq/types-devices";
import { readSpeculosLaunchArgs } from "./speculosLaunchArgs";

const URL = "https://run-1.speculos.example.com";

describe("readSpeculosLaunchArgs", () => {
  it("should read a Speculinho session with its token", () => {
    expect(
      readSpeculosLaunchArgs({
        speculosUrl: URL,
        speculosModel: DeviceModelId.stax,
        speculosToken: "token",
      }),
    ).toEqual({ address: URL, model: DeviceModelId.stax, sessionToken: "token" });
  });

  it("should read a local Speculos without a token and drop the trailing slash", () => {
    expect(
      readSpeculosLaunchArgs({
        speculosUrl: "http://127.0.0.1:5000/",
        speculosModel: DeviceModelId.nanoSP,
        speculosToken: "",
      }),
    ).toEqual({ address: "http://127.0.0.1:5000", model: DeviceModelId.nanoSP });
  });

  it("should name no device without a URL and a known model", () => {
    expect(readSpeculosLaunchArgs({})).toBeNull();
    expect(readSpeculosLaunchArgs({ speculosModel: DeviceModelId.stax })).toBeNull();
    expect(
      readSpeculosLaunchArgs({ speculosUrl: "run-1.example.com", speculosModel: "stax" }),
    ).toBeNull();
    expect(readSpeculosLaunchArgs({ speculosUrl: URL })).toBeNull();
    expect(readSpeculosLaunchArgs({ speculosUrl: URL, speculosModel: "nanoZ" })).toBeNull();
  });
});
