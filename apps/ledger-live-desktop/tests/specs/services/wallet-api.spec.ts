import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../page/discover.page";
import { Layout } from "../../component/layout.component";
import { Drawer } from "../../component/drawer.component";
import { Modal } from "../../component/modal.component";
import { DeviceAction } from "../../models/DeviceAction";
import { randomUUID } from "crypto";
import { LiveAppWebview } from "../../models/LiveAppWebview";
import BigNumber from "bignumber.js";
import { version as LLD_VERSION } from "../../../package.json";

const methods = [
  "account.request",
  "account.receive",
  "message.sign",
  "storage.get",
  "storage.set",
  "transaction.sign",
  "transaction.signAndBroadcast",
  "device.transport",
  "device.select",
  "device.open",
  "device.exchange",
  "device.close",
  "bitcoin.getAddress",
  "bitcoin.getPublicKey",
  "bitcoin.getXPub",
  "exchange.start",
  "exchange.complete",
  "account.list",
  "currency.list",
  "wallet.capabilities",
  "wallet.info",
  "wallet.userId",
];

const account_list_mock = {
  rawAccounts: [
    {
      address: "0x6EB963EFD0FEF7A4CFAB6CE6F1421C3279D11707",
      balance: "10135465432293584185",
      blockHeight: 122403,
      currency: "arbitrum",
      id: "1612c97a-e3bd-5c33-9618-215fc05f1853",
      name: "Arbitrum 1",
      spendableBalance: "10135465432293584185",
    },
    {
      id: "2d23ca2a-069e-579f-b13d-05bc706c7583",
      name: "Bitcoin 1 (legacy)",
      address: "1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ",
      currency: "bitcoin",
      balance: "35688397",
      spendableBalance: "35688397",
      blockHeight: 194870,
    },
    {
      id: "3463fc5b-deb9-5b19-a27e-4554624f2090",
      name: "Bitcoin 2 (legacy)",
      address: "19qAJ5F2eH7CRPFfj5c94x22zFcXpa8rZ77",
      currency: "bitcoin",
      balance: "128092473",
      spendableBalance: "128092473",
      blockHeight: 124828,
    },
    {
      id: "b60265f4-e52d-5800-9203-1609b9461654",
      name: "Bitcoin 3 (legacy)",
      address: "13x7TUzymwejUWQmoWusnYcdmC8RNMGG17f",
      currency: "bitcoin",
      balance: "0",
      spendableBalance: "0",
      blockHeight: 136277,
    },
    {
      id: "e86e3bc1-49e1-53fd-a329-96ba6f1b06d3",
      name: "Ethereum 1",
      address: "0x6EB963EFD0FEF7A4CFAB6CE6F1421C3279D11707",
      currency: "ethereum",
      balance: "10135465432293584185",
      spendableBalance: "10135465432293584185",
      blockHeight: 122403,
    },
    {
      id: "7c99915b-f186-5b44-82cc-fb21fa084292",
      parentAccountId: "e86e3bc1-49e1-53fd-a329-96ba6f1b06d3",
      name: "Ethereum 1 (DAI)",
      address: "0x6EB963EFD0FEF7A4CFAB6CE6F1421C3279D11707",
      currency: "ethereum/erc20/dai_stablecoin_v2_0",
      balance: "82865885",
      spendableBalance: "82865885",
      blockHeight: 122403,
    },
    {
      id: "d9d1d396-2081-53e1-9c67-f0623e0c4d3a",
      name: "Ethereum 2",
      address: "0x046615F0862392BC5E6FB43C92AAD73DE158D235",
      currency: "ethereum",
      balance: "11310048568372696785",
      spendableBalance: "11310048568372696785",
      blockHeight: 168357,
    },
    {
      id: "f5a525d7-1ec6-57ca-a26a-d34fc5158e84",
      parentAccountId: "d9d1d396-2081-53e1-9c67-f0623e0c4d3a",
      name: "Ethereum 2 (DAI)",
      address: "0x046615F0862392BC5E6FB43C92AAD73DE158D235",
      currency: "ethereum/erc20/dai_stablecoin_v2_0",
      balance: "81381327",
      spendableBalance: "81381327",
      blockHeight: 168357,
    },
    {
      id: "54b2563c-bd90-52c1-aca0-6099c701221f",
      parentAccountId: "d9d1d396-2081-53e1-9c67-f0623e0c4d3a",
      name: "Ethereum 2 (USDT)",
      address: "0x046615F0862392BC5E6FB43C92AAD73DE158D235",
      currency: "ethereum/erc20/usd_tether__erc20_",
      balance: "84437760",
      spendableBalance: "84437760",
      blockHeight: 168357,
    },
    {
      id: "80828eb7-49ca-54e8-8454-79c0e5557aec",
      parentAccountId: "d9d1d396-2081-53e1-9c67-f0623e0c4d3a",
      name: "Ethereum 2 (USDC)",
      address: "0x046615F0862392BC5E6FB43C92AAD73DE158D235",
      currency: "ethereum/erc20/usd__coin",
      balance: "102966480",
      spendableBalance: "102966480",
      blockHeight: 168357,
    },
    {
      id: "2f374bf7-948a-56b8-b967-fd6acd9e1f3d",
      name: "Ethereum 3",
      address: "0xE9CAF97C863A92EBB4D76FF37EE71C84D7E09723",
      currency: "ethereum",
      balance: "0",
      spendableBalance: "0",
      blockHeight: 181116,
    },
    {
      id: "e9ee57d1-f29c-55ed-ad85-de9b6426ce45",
      parentAccountId: "2f374bf7-948a-56b8-b967-fd6acd9e1f3d",
      name: "Ethereum 3 (DAI)",
      address: "0xE9CAF97C863A92EBB4D76FF37EE71C84D7E09723",
      currency: "ethereum/erc20/dai_stablecoin_v2_0",
      balance: "45480062",
      spendableBalance: "45480062",
      blockHeight: 181116,
    },
    {
      id: "753b0907-3616-5350-bccb-2484cefb2bec",
      parentAccountId: "2f374bf7-948a-56b8-b967-fd6acd9e1f3d",
      name: "Ethereum 3 (USDT)",
      address: "0xE9CAF97C863A92EBB4D76FF37EE71C84D7E09723",
      currency: "ethereum/erc20/usd_tether__erc20_",
      balance: "71817412",
      spendableBalance: "71817412",
      blockHeight: 181116,
    },
    {
      id: "d53ce93d-61d1-5ae1-8258-85a03e47f096",
      parentAccountId: "2f374bf7-948a-56b8-b967-fd6acd9e1f3d",
      name: "Ethereum 3 (USDC)",
      address: "0xE9CAF97C863A92EBB4D76FF37EE71C84D7E09723",
      currency: "ethereum/erc20/usd__coin",
      balance: "106621194",
      spendableBalance: "106621194",
      blockHeight: 181116,
    },
  ],
};

test.use({ userdata: "1AccountBTC1AccountETH1AccountARB" });

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
    permissions: methods,
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

test("Wallet API methods @smoke", async ({ page }) => {
  if (!testServerIsRunning) {
    console.warn("Test server not running - Cancelling Wallet API E2E test");
    return;
  }

  const discoverPage = new DiscoverPage(page);
  const liveAppWebview = new LiveAppWebview(page);
  const drawer = new Drawer(page);
  const modal = new Modal(page);
  const layout = new Layout(page);
  const deviceAction = new DeviceAction(page);

  await test.step("account.request", async () => {
    await layout.goToDiscover();
    await discoverPage.openTestApp();
    await drawer.continue();
    await drawer.waitForDrawerToDisappear();

    const id = randomUUID();
    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "account.request",
      params: {
        currencyIds: ["ethereum", "bitcoin", "ethereum/erc20/usd_tether__erc20_"],
      },
    });

    await drawer.waitForDrawerToBeVisible();

    await drawer.selectCurrency("tether usd");
    // Test name and balance for tokens
    await expect(drawer.getAccountButton("tether usd", 2)).toContainText(
      "Ethereum 3 (USDT)71.8174 USDT",
    );
    await drawer.back();

    await drawer.selectCurrency("bitcoin");
    await drawer.selectAccount("bitcoin");

    await drawer.waitForDrawerToDisappear();

    await expect(response).resolves.toMatchObject({
      id,
      jsonrpc: "2.0",
      result: {
        rawAccount: {
          id: "2d23ca2a-069e-579f-b13d-05bc706c7583",
          address: "1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ",
          balance: "35688397",
          blockHeight: 194870,
          currency: "bitcoin",
          name: "Bitcoin 1 (legacy)",
          spendableBalance: "35688397",
        },
      },
    });
  });

  await test.step("account.receive", async () => {
    const id = randomUUID();
    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "account.receive",
      params: {
        accountId: "2d23ca2a-069e-579f-b13d-05bc706c7583",
      },
    });

    await deviceAction.openApp();
    await deviceAction.complete();
    await modal.waitForModalToDisappear();
    await expect(response).resolves.toStrictEqual({
      id,
      jsonrpc: "2.0",
      result: {
        address: "1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ",
      },
    });
  });

  await test.step("account.list", async () => {
    const id = randomUUID();
    const response = await liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "account.list",
    });

    const responseFiltred = {
      id,
      rawAccounts: response.result.rawAccounts.map(
        ({ lastSyncDate, ...rest }: { lastSyncDate: Date; rest: unknown }) => rest,
      ),
    };

    expect(responseFiltred).toStrictEqual({
      id,
      ...account_list_mock,
    });
  });

  await test.step("bitcoin.getXPub", async () => {
    const id = randomUUID();
    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "bitcoin.getXPub",
      params: {
        accountId: "3463fc5b-deb9-5b19-a27e-4554624f2090",
      },
    });

    await expect(response).resolves.toStrictEqual({
      id,
      jsonrpc: "2.0",
      result: {
        xPub: "D2C2B76D346B6EA64EB4F8C6E9995F81C39E0A2449CA1B3D87AF9D720ABD35C2",
      },
    });
  });

  await test.step("currency.list", async () => {
    const id = randomUUID();
    const response = await liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "currency.list",
      params: {
        currencyIds: [
          "bitcoin",
          "ethereum",
          "ethereum/erc20/usd_tether__erc20_",
          // "arbitrum/erc20/arbitrum", // Still not able to get the test fetching tokens with an account present
        ],
      },
    });

    expect(response).toMatchObject({
      id,
      result: {
        currencies: [
          {
            type: "CryptoCurrency",
            id: "bitcoin",
            ticker: "BTC",
            name: "Bitcoin",
            family: "bitcoin",
            color: "#ffae35",
            decimals: 8,
          },
          {
            type: "CryptoCurrency",
            id: "ethereum",
            ticker: "ETH",
            name: "Ethereum",
            family: "ethereum",
            color: "#0ebdcd",
            decimals: 18,
          },
          {
            type: "TokenCurrency",
            standard: "ERC20",
            id: "ethereum/erc20/usd_tether__erc20_",
            ticker: "USDT",
            contract: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            name: "Tether USD",
            parent: "ethereum",
            color: "#0ebdcd",
            decimals: 6,
          },
          // {
          //   type: "TokenCurrency",
          //   standard: "ERC20",
          //   id: "arbitrum/erc20/arbitrum",
          //   ticker: "ARB",
          //   contract: "0x912CE59144191C1204E64559FE8253a0e49E6548",
          //   name: "Arbitrum",
          //   parent: "arbitrum",
          //   color: "#28a0f0",
          //   decimals: 18,
          // },
        ],
      },
    });
  });

  await test.step("currency.list should stay stable for CryptoCurrency", async () => {
    const id = randomUUID();
    const response = await liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "currency.list",
    });

    // We remove TokenCurrency because they might change a lot more frequently and we really care if a family disappear
    const currencies = response.result.currencies.filter(
      (currency: { type: string }) => currency.type === "CryptoCurrency",
    );

    expect(JSON.stringify(currencies, null, 2)).toMatchSnapshot("wallet-api-currencies.json");
  });

  await test.step("storage", async () => {
    const id = randomUUID();
    const value = randomUUID();

    const responseSet = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "storage.set",
      params: {
        key: "testKey",
        value,
      },
    });

    await expect(responseSet).resolves.toStrictEqual({ jsonrpc: "2.0", id });

    const responseGet = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "storage.get",
      params: {
        key: "testKey",
      },
    });

    await expect(responseGet).resolves.toStrictEqual({
      jsonrpc: "2.0",
      id,
      result: { value },
    });
  });

  await test.step("transaction.sign", async () => {
    const id = randomUUID();

    const recipient = "0x046615F0862392BC5E6FB43C92AAD73DE158D235";

    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "transaction.sign",
      params: {
        //ETH Account
        accountId: "e86e3bc1-49e1-53fd-a329-96ba6f1b06d3",
        rawTransaction: {
          family: "ethereum",
          amount: new BigNumber(100000000000000),
          recipient,
          data: Buffer.from("SomeDataInHex").toString("hex"),
        },
      },
    });

    // Step Fees
    await expect(page.getByText(/learn more about fees/i)).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Recipient
    await expect(page.getByText(recipient)).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Device
    await deviceAction.silentSign();

    await expect(response).resolves.toStrictEqual({
      id,
      jsonrpc: "2.0",
      result: { signedTransactionHex: "" },
    });
  });

  await test.step("transaction.signAndBroadcast", async () => {
    const id = randomUUID();

    const recipient = "0x046615F0862392BC5E6FB43C92AAD73DE158D235";

    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "transaction.signAndBroadcast",
      params: {
        //ETH Account
        accountId: "e86e3bc1-49e1-53fd-a329-96ba6f1b06d3",
        rawTransaction: {
          family: "ethereum",
          amount: new BigNumber(100000000000000),
          recipient,
          data: Buffer.from("SomeDataInHex").toString("hex"),
        },
      },
    });

    // Step Fees
    await expect(page.getByText(/learn more about fees/i)).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Recipient
    await expect(page.getByText(recipient)).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Device
    await deviceAction.silentSign();

    // Click on notification toaster
    // NOTE: toaster not visible in output, need to find a better way to handle css animations
    // await page.waitForSelector('[data-testid="toaster"][style="opacity: 1;"]');
    const toaster = page.getByTestId("toaster");
    await toaster.scrollIntoViewIfNeeded();
    await expect(toaster).toBeVisible();
    await expect(toaster.getByText("Transaction sent !")).toBeVisible();

    // Display transaction drawer
    await toaster.click();
    const drawer = page.getByTestId("drawer-content");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("View in explorer")).toBeVisible();
    await expect(drawer.getByText("Confirmed")).toBeVisible();

    await expect(response).resolves.toStrictEqual({
      id,
      jsonrpc: "2.0",
      result: {
        transactionHash: "32BEBB4660C4C328F7E130D0E1F45D5B2AFD9129B903E0F3B6EA52756329CD25",
      },
    });
  });

  await test.step("wallet.capabilities", async () => {
    const id = randomUUID();

    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "wallet.capabilities",
    });

    await expect(response).resolves.toStrictEqual({
      id,
      jsonrpc: "2.0",

      result: {
        methodIds: methods,
      },
    });
  });

  await test.step("wallet.userId", async () => {
    const id = randomUUID();

    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "wallet.userId",
    });

    await expect(response).resolves.toStrictEqual({
      id,
      jsonrpc: "2.0",
      result: { userId: "08cf3393-c5eb-4ea7-92de-0deea22e3971" },
    });
  });

  await test.step("wallet.info", async () => {
    const id = randomUUID();

    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "wallet.info",
    });

    await expect(response).resolves.toStrictEqual({
      id,
      jsonrpc: "2.0",
      result: {
        tracking: true,
        wallet: { name: "ledger-live-desktop", version: LLD_VERSION },
      },
    });
  });
});
