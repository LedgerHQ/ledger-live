import Btc from "../src/Btc";
import BtcNew from "../src/BtcNew";
import BtcOld from "../src/BtcOld";
import { getAppAndVersion } from "../src/getAppAndVersion";

jest.mock("../src/getAppAndVersion");
jest.mock("../src/BtcNew");
jest.mock("../src/BtcOld");
jest.mock("../src/newops/appClient");

describe("Btc", () => {
  let mockTransport: any;
  let mockedGetAppAndVersion: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransport = {
      decorateAppAPIMethods: jest.fn(),
    };
    mockedGetAppAndVersion = jest.mocked(getAppAndVersion);
  });

  it("should use BtcNew for 'Bitcoin Recovery' app", async () => {
    mockedGetAppAndVersion.mockResolvedValue({
      name: "Bitcoin Recovery",
      version: "2.4.0",
    });

    const btc = new Btc({ transport: mockTransport, currency: "bitcoin" });
    const impl = await btc.changeImplIfNecessary();
    // Check that getAppAndVersion has been called
    expect(mockedGetAppAndVersion).toHaveBeenCalledWith(mockTransport);
    expect(impl).toBeInstanceOf(BtcNew);
    expect(impl).not.toBeInstanceOf(BtcOld);
  });
});
