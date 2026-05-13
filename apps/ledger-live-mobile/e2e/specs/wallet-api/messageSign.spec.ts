import DeviceAction from "../../models/DeviceAction";
import { afterAllWalletApi, afterEachWalletApi, beforeAllWalletApi } from "./walletApiLifecycle";

describe("Wallet API methods — message.sign", () => {
  let deviceAction: DeviceAction;

  beforeAll(async () => {
    deviceAction = await beforeAllWalletApi();
  });
  afterAll(afterAllWalletApi);
  afterEach(afterEachWalletApi);

  it("message.sign", async () => {
    const account = "Ethereum 1";
    const message = "Hello World! This is a test message for signing.";

    await app.dummyWalletApp.setAccountId("e86e3bc1-49e1-53fd-a329-96ba6f1b06d3");
    await app.dummyWalletApp.setMessage(message);
    await app.dummyWalletApp.messageSign();

    await app.walletAPISignMessage.expectSummary(account, message);
    await app.walletAPISignMessage.summaryContinue();
    await deviceAction.selectMockDevice();
    await deviceAction.silentSign();

    const res = await app.dummyWalletApp.getResOutput();
    expect(res).toBe("mockedSignature");
  });
});
