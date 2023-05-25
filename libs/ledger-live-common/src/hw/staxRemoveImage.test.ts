import {
  StatusCodes,
  UnexpectedBootloader,
  UserRefusedOnDevice,
} from "@ledgerhq/errors";
import { command as staxRemoveImage } from "./staxRemoveImage";
import Transport from "@ledgerhq/hw-transport";
import { ImageDoesNotExistOnDevice } from "../errors";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore next-line
const mockTransportGenerator = (out) => ({ send: () => out } as Transport);

describe("staxRemoveImage", () => {
  test("should succeed if user approves", async () => {
    const mockedTransport: Transport = mockTransportGenerator(
      Buffer.from(StatusCodes.OK.toString(16), "hex")
    );
    await expect(staxRemoveImage(mockedTransport)).resolves.toBeUndefined();
  });

  test("should fail with correct error if user refuses", async () => {
    const mockedTransport: Transport = mockTransportGenerator(
      Buffer.from(StatusCodes.USER_REFUSED_ON_DEVICE.toString(16), "hex")
    );
    await expect(staxRemoveImage(mockedTransport)).rejects.toThrow(
      UserRefusedOnDevice
    );
  });

  test("should throw if user refuses", async () => {
    const mockedTransport: Transport = mockTransportGenerator(
      Buffer.from(StatusCodes.USER_REFUSED_ON_DEVICE.toString(16), "hex")
    );
    await expect(staxRemoveImage(mockedTransport)).rejects.toThrow(Error);
  });

  test("missing image, should throw", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from(StatusCodes.CUSTOM_IMAGE_EMPTY.toString(16), "hex")
    );
    await expect(staxRemoveImage(mockedTransport)).rejects.toThrow(
      ImageDoesNotExistOnDevice
    );
  });

  test("unexpected bootloader or any other code, should throw", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from(StatusCodes.CUSTOM_IMAGE_BOOTLOADER.toString(16), "hex")
    );
    await expect(staxRemoveImage(mockedTransport)).rejects.toThrow(
      UnexpectedBootloader
    );
  });
});
