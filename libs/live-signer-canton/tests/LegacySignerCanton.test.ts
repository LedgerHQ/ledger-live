import Canton from "@ledgerhq/hw-app-canton";
import { LegacySignerCanton } from "../src/LegacySignerCanton";
import { UpdateYourApp } from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";

const PATH = "44'/6767'/0'/0'/0'";
const signer = new LegacySignerCanton({ decorateAppAPIMethods: () => {} } as unknown as Transport);

describe("LegacySignerCanton", () => {
  it("should throw UpdateYourApp for outdated version", async () => {
    const getAppConfiguration = jest
      .spyOn(Canton.prototype, "getAppConfiguration")
      .mockResolvedValue({
        version: "2.4.2",
      });

    await expect(signer.getAddress(PATH)).rejects.toThrow(UpdateYourApp);
    expect(getAppConfiguration).toHaveBeenCalledWith();
  });
});
