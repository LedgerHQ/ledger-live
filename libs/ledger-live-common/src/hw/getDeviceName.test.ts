import { aTransportBuilder } from "@ledgerhq/hw-transport-mocker";
import getDeviceName from "./getDeviceName";

const mockedSend = jest.fn();
const mockedTransport = aTransportBuilder({ send: mockedSend });

describe("getDeviceName", () => {
  test("should return name if available", async () => {
    mockedSend.mockResolvedValue(Buffer.from("646576696365206e616d659000", "hex"));

    const res = await getDeviceName(mockedTransport);

    expect(res).toMatch("device name");
  });

  test("should return empty name when the device is not onboarded", async () => {
    mockedSend.mockResolvedValue(Buffer.from("bababababababa6d07", "hex"));

    const res = await getDeviceName(mockedTransport);

    expect(res).toMatch("");
  });

  test("should return empty name when the device is not onboarded #2", async () => {
    mockedSend.mockResolvedValue(Buffer.from("bababababababa6611", "hex"));

    const res = await getDeviceName(mockedTransport);

    expect(res).toMatch("");
  });

  test("unexpected bootloader or any other code, should throw", async () => {
    mockedSend.mockResolvedValue(Buffer.from("662d", "hex"));

    await expect(getDeviceName(mockedTransport)).rejects.toThrow(Error);
  });
});
