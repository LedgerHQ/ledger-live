import { startDummyServer, stopDummyServer as stopDummyServer } from "@ledgerhq/test-utils";

export async function startLiveApp(liveAppDirectory: string, liveAppPort = 3000) {
  try {
    const port = await startDummyServer(`${liveAppDirectory}/dist`, liveAppPort);

    const url = `http://localhost:${port}`;
    const response = await fetch(url);
    if (response.ok) {
      // eslint-disable-next-line no-console
      console.info(
        `========> Dummy Wallet API app successfully running on port ${port}! <=========`,
      );
      return true;
    } else {
      throw new Error("Ping response != 200, got: " + response.status);
    }
  } catch (error) {
    console.warn(`========> Dummy test app not running! <=========`);
    console.error(error);
    return false;
  }
}

export async function stopServer() {
  await stopDummyServer();
}
