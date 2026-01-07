import test from "../../fixtures/common";
import { LiveAppWebview } from "../../models/LiveAppWebview";
import { DiscoverPage } from "../../page/discover.page";
import { Layout } from "../../component/layout.component";
import { Drawer } from "../../component/drawer.component";

test.use({
  userdata: "skip-onboarding",
  settings: {
    enablePlatformDevTools: true,
  },
});

let testServerIsRunning = false;

test.beforeAll(async () => {
  // Check that dummy app in tests/dummy-live-app has been started successfully
  testServerIsRunning = await LiveAppWebview.startLiveApp("dummy-wallet-app/dist", {
    name: "Dummy Wallet API Live App",
    id: "dummy-live-app",
    apiVersion: "2.0.0",
    content: {
      shortDescription: {
        en: "App to test the Wallet API",
      },
      description: {
        en: "App to test the Wallet API with Playwright",
      },
    },
  });

  if (!testServerIsRunning) {
    console.warn("Stopping Buy/Sell test setup");
    return;
  }
});

test.afterAll(async () => {
  if (testServerIsRunning) {
    await LiveAppWebview.stopLiveApp();
  }
});

test("Webview Auto close Dev Tools when leaving", async ({ page, electronApp }) => {
  if (!testServerIsRunning) {
    console.warn("Test server not running - Cancelling Wallet API E2E test");
    return;
  }

  const layout = new Layout(page);
  const drawer = new Drawer(page);
  const discoverPage = new DiscoverPage(page);
  const liveAppWebview = new LiveAppWebview(page, electronApp);

  await test.step("open live-app", async () => {
    await layout.goToDiscover();
    await discoverPage.waitForDiscoverVisible();
    await discoverPage.openTestApp();
    await drawer.continue();
    await drawer.waitForDrawerToDisappear();
  });

  await test.step("open devtools", async () => {
    await liveAppWebview.openDevTools();
    await liveAppWebview.checkDevToolsOpened();
  });

  await test.step("leave the live-app", async () => {
    await liveAppWebview.closeLiveApp();
    await liveAppWebview.checkDevToolsClosed();
    // Make sure we are back on discover page
    await discoverPage.waitForDiscoverVisible();
  });

  await test.step("open live-app second time", async () => {
    await discoverPage.openTestApp();
    await drawer.continue();
    await drawer.waitForDrawerToDisappear();
  });

  await test.step("open devtools second time", async () => {
    await liveAppWebview.openDevTools();
    await liveAppWebview.checkDevToolsOpened();
  });

  await test.step("leave the live-app second time", async () => {
    await liveAppWebview.closeLiveApp();
    await liveAppWebview.checkDevToolsClosed();
    // Make sure we are back on discover page
    await discoverPage.waitForDiscoverVisible();
  });
});
