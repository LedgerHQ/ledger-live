import { isCounterfeitError } from "./isCounterfeitError";
import { DeviceSocketFail } from "../errors";

describe("isCounterfeitError", () => {
  it("should return true if the error is a DeviceSocketFail", () => {
    expect(isCounterfeitError(new DeviceSocketFail("Counterfeit device detected"))).toBe(true);
  });
});
