import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../page/discover.page";
import { Layout } from "../../component/layout.component";
import { Drawer } from "../../component/drawer.component";
import { Modal } from "../../component/modal.component";
import { DeviceAction } from "../../models/DeviceAction";
import { LiveAppWebview } from "../../models/LiveAppWebview";
import { version as LLD_VERSION } from "../../../package.json";
import { expectedCurrencyList, mockedAccountList } from "tests/fixtures/wallet-api";

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

test.use({ userdata: "1AccountBTC1AccountETH1AccountARB1AccountSOL" });

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

test("Wallet API methods @smoke", async ({ page, electronApp }) => {
  if (!testServerIsRunning) {
    console.warn("Test server not running - Cancelling Wallet API E2E test");
    return;
  }

  const discoverPage = new DiscoverPage(page);
  const liveAppWebview = new LiveAppWebview(page, electronApp);
  const drawer = new Drawer(page);
  const modal = new Modal(page);
  const layout = new Layout(page);
  const deviceAction = new DeviceAction(page);

  // Reset the webview after each test to ensure a clean state
  // We have to call it manually because playwright doesn't support afterEach hook for steps
  async function resetWebview() {
    await liveAppWebview.clearStates();
  }

  await test.step("open live-app", async () => {
    await layout.goToDiscover();
    await discoverPage.openTestApp();
    await drawer.continue();
    await drawer.waitForDrawerToDisappear();
  });

  await test.step("account.request", async () => {
    await liveAppWebview.setCurrencyIds([
      "bitcoin",
      "ethereum",
      "ethereum/erc20/usd_tether__erc20_",
    ]);

    await liveAppWebview.accountRequest();

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

    const res = await liveAppWebview.getResOutput();
    expect(res).toMatchObject({
      id: "2d23ca2a-069e-579f-b13d-05bc706c7583",
      address: "1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ",
      balance: "35688397",
      blockHeight: 194870,
      currency: "bitcoin",
      name: "Bitcoin 1 (legacy)",
      spendableBalance: "35688397",
    });

    await resetWebview();
  });

  await test.step("account.receive", async () => {
    await liveAppWebview.setAccountId("2d23ca2a-069e-579f-b13d-05bc706c7583");

    await liveAppWebview.accountReceive();

    await deviceAction.openApp();
    await deviceAction.complete();
    await modal.waitForModalToDisappear();

    const res = await liveAppWebview.getResOutput();
    expect(res).toBe("1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ");

    await resetWebview();
  });

  await test.step("account.list", async () => {
    await liveAppWebview.accountList();

    const res = await liveAppWebview.getResOutput();
    expect(res).toMatchObject(mockedAccountList);

    await resetWebview();
  });

  await test.step("bitcoin.getXPub", async () => {
    await liveAppWebview.setAccountId("3463fc5b-deb9-5b19-a27e-4554624f2090");
    await liveAppWebview.bitcoinGetXPub();

    const res = await liveAppWebview.getResOutput();
    expect(res).toBe("D2C2B76D346B6EA64EB4F8C6E9995F81C39E0A2449CA1B3D87AF9D720ABD35C2");

    await resetWebview();
  });

  await test.step("currency.list", async () => {
    await liveAppWebview.setCurrencyIds([
      "bitcoin",
      "ethereum",
      "ethereum/erc20/usd_tether__erc20_",
      // "arbitrum/erc20/arbitrum", // Still not able to get the test fetching tokens with an account present
    ]);

    await liveAppWebview.currencyList();

    const res = await liveAppWebview.getResOutput();
    expect(res).toMatchObject([
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
    ]);

    await resetWebview();
  });

  await test.step("currency.list should stay stable for CryptoCurrency", async () => {
    await liveAppWebview.currencyList();

    const res = await liveAppWebview.getResOutput();
    // We remove TokenCurrency because they might change a lot more frequently and we really care if a family disappear
    const currencies = res.filter(
      (currency: { type: string }) => currency.type === "CryptoCurrency",
    );
    expect(currencies).toMatchObject(expectedCurrencyList);

    await resetWebview();
  });

  await test.step("storage", async () => {
    await liveAppWebview.storage();

    const res = await liveAppWebview.getResOutput();
    expect(res).toBe("test-value");

    await resetWebview();
  });

  await test.step("transaction.sign", async () => {
    const recipient = "0x046615F0862392BC5E6FB43C92AAD73DE158D235";
    const amount = "500000000000000"; // 0.0005 ETH in wei
    const data = "TestDataForEthereumTransaction";

    await liveAppWebview.setAccountId("e86e3bc1-49e1-53fd-a329-96ba6f1b06d3");
    await liveAppWebview.setRecipient(recipient);
    await liveAppWebview.setAmount(amount);
    await liveAppWebview.setData(data);
    await liveAppWebview.transactionSign();

    // Step Fees
    await expect(page.getByText(/learn more about fees/i)).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Recipient
    await expect(page.getByText(recipient)).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Device
    await deviceAction.silentSign();

    const res = await liveAppWebview.getResOutput();
    expect(res).toBe("empty response");

    await resetWebview();
  });

  await test.step("transaction.sign solana", async () => {
    const recipient = "63M7kPJvLsG46jbR2ZriEU8xwPqkMNKNoBBQ46pobbvo";
    const amount = "1000000"; // 0.001 SOL in lamports

    await liveAppWebview.setAccountId("2fa370fd-2210-5487-b9c9-bc36971ebc72");
    await liveAppWebview.setRecipient(recipient);
    await liveAppWebview.setAmount(amount);
    await liveAppWebview.transactionSignSolana();

    // Step Recipient
    await expect(page.getByText(recipient)).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Device
    await deviceAction.silentSign();

    const res = await liveAppWebview.getResOutput();
    expect(res).toMatchObject({
      message: {
        accountKeys: [
          "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
          "63M7kPJvLsG46jbR2ZriEU8xwPqkMNKNoBBQ46pobbvo",
          "ComputeBudget111111111111111111111111111111",
          "11111111111111111111111111111111",
        ],
        header: {
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 2,
          numRequiredSignatures: 1,
        },
        indexToProgramIds: {},
        instructions: [
          { accounts: [], data: "Fyn5d1", programIdIndex: 2 },
          { accounts: [0, 1], data: "3Bxs4Bc3VYuGVB19", programIdIndex: 3 },
        ],
        recentBlockhash: "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3",
      },
    });

    await resetWebview();
  });

  await test.step("transaction.sign raw solana simple", async () => {
    const rawTx =
      "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDNzWs4isgmR+LEHY8ZcgBBLMnC4ckD1iuhSa2/Y+69I91oyGFaAZ/9w4srgx9KoqiHtPM6Vur7h4D6XVoSgrEhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALt5JNk+MAN8BXYrlkxMEL1C/sM3+ZFYwZw4eofBOKp4BAgIAAQwCAAAAgJaYAAAAAAA=";

    await liveAppWebview.setAccountId("2fa370fd-2210-5487-b9c9-bc36971ebc72");
    await liveAppWebview.setData(rawTx);
    await liveAppWebview.transactionSignRawSolana();

    // Step Recipient
    await expect(page.getByText("Blind signing required")).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Device
    await deviceAction.silentSign();

    const res = await liveAppWebview.getResOutput();
    expect(res).toMatchObject({
      message: {
        header: {
          numRequiredSignatures: 1,
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 1,
        },
        accountKeys: [
          "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
          "8vCyX7oB6Pc3pbWMGYYZF5pbSnAdQ7Gyr32JqxqCy8ZR",
          "11111111111111111111111111111111",
        ],
        recentBlockhash: "49xM1QggKfcKj2ixPYyAgMfoD3oPne8Fj9WdCLjsLuMo",
        instructions: [
          {
            programIdIndex: 2,
            accounts: [0, 1],
            data: "3Bxs4NN8M2Yn4TLb",
          },
        ],
        indexToProgramIds: {},
      },
    });

    await resetWebview();
  });

  await test.step("transaction.sign raw solana simple versioned tx", async () => {
    const rawTx =
      "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQABAzc1rOIrIJkfixB2PGXIAQSzJwuHJA9YroUmtv2PuvSPdaMhhWgGf/cOLK4MfSqKoh7TzOlbq+4eA+l1aEoKxIQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABfLzKkOix18SH7aJB0ftIw4FuVJdpsGNCeSOTPzs9KKAQICAAEMAgAAAICWmAAAAAAAAA==";

    await liveAppWebview.setAccountId("2fa370fd-2210-5487-b9c9-bc36971ebc72");
    await liveAppWebview.setData(rawTx);
    await liveAppWebview.transactionSignRawSolana();

    // Step Recipient
    await expect(page.getByText("Blind signing required")).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Device
    await deviceAction.silentSign();

    const res = await liveAppWebview.getResOutput();
    expect(res).toMatchObject({
      message: {
        header: {
          numRequiredSignatures: 1,
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 1,
        },
        staticAccountKeys: [
          "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
          "8vCyX7oB6Pc3pbWMGYYZF5pbSnAdQ7Gyr32JqxqCy8ZR",
          "11111111111111111111111111111111",
        ],
        recentBlockhash: "2btcs2WqZ7xXxjLsmmBxgNQYUv22EoMzVmSz92KJob13",
        compiledInstructions: [
          {
            programIdIndex: 2,
            accountKeyIndexes: [0, 1],
            data: {
              "0": 2,
              "1": 0,
              "2": 0,
              "3": 0,
              "4": 128,
              "5": 150,
              "6": 152,
              "7": 0,
              "8": 0,
              "9": 0,
              "10": 0,
              "11": 0,
            },
          },
        ],
        addressTableLookups: [],
      },
    });

    await resetWebview();
  });

  await test.step("transaction.sign raw solana jup", async () => {
    const rawTx =
      "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQADCjc1rOIrIJkfixB2PGXIAQSzJwuHJA9YroUmtv2PuvSPJGEHQWQLekD/dvAcpnMP2/tG3aYY5eJPwCIdQraAPCxEmBJ9MMUfrE0XakyEUZnEtlYyXwSxgHdGjzuUfCe5YlRv0RZO0KA6xpP2ZTy3gPYYekA+GRdTZ9xkFdPoP6mN+PTko52VL0CIM2xtl0WkvNslD6Wawxr7yd9HYllN4Lz1QisC8APtk6AnjCKZmDRfJdI4LPZhcTyQg0m67HXuHf5nhgvgw+u73a6p2g72pShJs/a3e0XIG/SmJess9cE+AwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAEedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTjwbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCpFroxe4U6J5YhwTYIw4Hl0OWWmFfNquad1njJfzq2aU8FBwAFAvWoBAAHAAkDk/ECAAAAAAAIBQUAHQkYCZPxe2T0hK52/Qg/CRsAAwoLBRodCAgZCCEbCgsMDg0PICIfJwkmGxopCgQTEhARJCUjJwkeKhcqFRQECx0pFiobCQkoKgYCAQgcLMEgmzNB1pyBAAMAAAA5XQADTwcAAiZkAgOAhB4AAAAAADGJsAAAAAAAMgAACQMFAAABCQQpv5UHKk+/BN9xdZPnOLzMIScoFcJHGoDZ+fVVsNSEJQIpGAcTACgDAhcVWX05K6qoNBpFvohhQGiBxG4ZEV+GAgS6FrxyNTh9k9oEYAYFZQQDCQIBfcDHFwIcy2bnEz7RejJmfNDT1qvRg9d3bphgF42pbGoEePR08gXxb3l187d006g+ZmeaKFPjpBstjVj8egEUslf/CvI0AyqNtu4dBOPkyscDzsbL";

    await liveAppWebview.setAccountId("2fa370fd-2210-5487-b9c9-bc36971ebc72");
    await liveAppWebview.setData(rawTx);
    await liveAppWebview.transactionSignRawSolana();

    // Step Recipient
    await expect(page.getByText("Blind signing required")).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Device
    await deviceAction.silentSign();

    const res = await liveAppWebview.getResOutput();
    expect(res).toMatchObject({
      message: {
        header: {
          numRequiredSignatures: 1,
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 3,
        },
        staticAccountKeys: [
          "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
          "3T1VPbkDEMTHBUEsPgGFeC5JDcGmPYLo8hMz2zuMQs1D",
          "5cmDadKuL5FqJd8gAor15yyML93jWMZE2JFYSeJU4RoF",
          "6gc8zvoV4yD5xQufHewkr4mP2ouMGoRVmWCBKAmrroCY",
          "HkphEpUqnFBxBuCPEq5j1HA9L8EwmsmRT6UcFKziptM1",
          "HWPQWMdTqoPVRZpUULkRMJTbjks21BRiCmvtSFBfrQon",
          "J867VvEyqCiwYXJgRLL9VZcjuGr6oNBgWwbN97LjT6RB",
          "ComputeBudget111111111111111111111111111111",
          "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        ],
        recentBlockhash: "2Xie6kgDVTCMsGYDJXA3h1EDaMRV4Yk3rWy3isWPVyRY",
        compiledInstructions: [
          {
            programIdIndex: 7,
            accountKeyIndexes: [],
            data: {
              "0": 2,
              "1": 245,
              "2": 168,
              "3": 4,
              "4": 0,
            },
          },
          {
            programIdIndex: 7,
            accountKeyIndexes: [],
            data: {
              "0": 3,
              "1": 147,
              "2": 241,
              "3": 2,
              "4": 0,
              "5": 0,
              "6": 0,
              "7": 0,
              "8": 0,
            },
          },
          {
            programIdIndex: 8,
            accountKeyIndexes: [5, 0, 29, 9, 24],
            data: {
              "0": 147,
              "1": 241,
              "2": 123,
              "3": 100,
              "4": 244,
              "5": 132,
              "6": 174,
              "7": 118,
              "8": 253,
            },
          },
          {
            programIdIndex: 8,
            accountKeyIndexes: [
              9, 27, 0, 3, 10, 11, 5, 26, 29, 8, 8, 25, 8, 33, 27, 10, 11, 12, 14, 13, 15, 32, 34,
              31, 39, 9, 38, 27, 26, 41, 10, 4, 19, 18, 16, 17, 36, 37, 35, 39, 9, 30, 42, 23, 42,
              21, 20, 4, 11, 29, 41, 22, 42, 27, 9, 9, 40, 42, 6, 2, 1, 8, 28,
            ],
            data: {
              "0": 193,
              "1": 32,
              "2": 155,
              "3": 51,
              "4": 65,
              "5": 214,
              "6": 156,
              "7": 129,
              "8": 0,
              "9": 3,
              "10": 0,
              "11": 0,
              "12": 0,
              "13": 57,
              "14": 93,
              "15": 0,
              "16": 3,
              "17": 79,
              "18": 7,
              "19": 0,
              "20": 2,
              "21": 38,
              "22": 100,
              "23": 2,
              "24": 3,
              "25": 128,
              "26": 132,
              "27": 30,
              "28": 0,
              "29": 0,
              "30": 0,
              "31": 0,
              "32": 0,
              "33": 49,
              "34": 137,
              "35": 176,
              "36": 0,
              "37": 0,
              "38": 0,
              "39": 0,
              "40": 0,
              "41": 50,
              "42": 0,
              "43": 0,
            },
          },
          {
            programIdIndex: 9,
            accountKeyIndexes: [5, 0, 0],
            data: {
              "0": 9,
            },
          },
        ],
        addressTableLookups: [
          {
            accountKey: "3oy9ojnsDzqmMNi87Gs7Hn5v3MPVqnWjG9k8BmzKR7yW",
            writableIndexes: [41, 24],
            readonlyIndexes: [19, 0, 40, 3, 2, 23, 21],
          },
          {
            accountKey: "72L2vpvB2EntpASsx4rG5UhrvC1k4eJX1amRPuVpNX53",
            writableIndexes: [96, 6, 5, 101],
            readonlyIndexes: [3, 9, 2, 1],
          },
          {
            accountKey: "9TtTSHEvN9HfXQC1VxyqjmuQFAr6JbNJn3nPEv5oVvx1",
            writableIndexes: [120, 244, 116, 242],
            readonlyIndexes: [241, 111, 121, 117, 243],
          },
          {
            accountKey: "DM8vzXD2dwSoUQXFNcFnhH1QS2hz9AsKV2XpEbZYTDG8",
            writableIndexes: [227, 228, 202, 199],
            readonlyIndexes: [206, 198, 203],
          },
        ],
      },
    });

    await resetWebview();
  });

  await test.step("transaction.sign should block sanctioned address", async () => {
    const recipient = "0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf"; // Sanctioned address
    const amount = "500000000000000"; // 0.0005 ETH in wei

    await liveAppWebview.setAccountId("a758d3a7-e057-5fcc-8b6e-23169bc4d577");
    await liveAppWebview.setRecipient(recipient);
    await liveAppWebview.setAmount(amount);
    await liveAppWebview.transactionSign();

    await expect(page.getByText(/keeping you safe/i)).toBeVisible();
    await modal.continueIsDisabled();
    await modal.close();

    await resetWebview();
  });

  await test.step("transaction.signAndBroadcast", async () => {
    const recipient = "0x046615F0862392BC5E6FB43C92AAD73DE158D235";
    const amount = "750000000000000"; // 0.00075 ETH in wei
    const data = "SignAndBroadcastTestData";

    await liveAppWebview.setAccountId("e86e3bc1-49e1-53fd-a329-96ba6f1b06d3");
    await liveAppWebview.setRecipient(recipient);
    await liveAppWebview.setAmount(amount);
    await liveAppWebview.setData(data);
    await liveAppWebview.transactionSignAndBroadcast();

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

    const res = await liveAppWebview.getResOutput();
    expect(res).toBe("32BEBB4660C4C328F7E130D0E1F45D5B2AFD9129B903E0F3B6EA52756329CD25");

    await resetWebview();
  });

  await test.step("wallet.capabilities", async () => {
    await liveAppWebview.walletCapabilities();

    const res = await liveAppWebview.getResOutput();
    expect(res).toEqual(methods);

    await resetWebview();
  });

  await test.step("wallet.userId", async () => {
    await liveAppWebview.walletUserId();

    const res = await liveAppWebview.getResOutput();
    expect(res).toBe("08cf3393-c5eb-4ea7-92de-0deea22e3971");

    await resetWebview();
  });

  await test.step("wallet.info", async () => {
    await liveAppWebview.walletInfo();

    const res = await liveAppWebview.getResOutput();
    expect(res).toMatchObject({
      tracking: true,
      wallet: { name: "ledger-live-desktop", version: LLD_VERSION },
    });

    await resetWebview();
  });
});
