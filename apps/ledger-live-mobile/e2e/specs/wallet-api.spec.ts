import DeviceAction from "../models/DeviceAction";
import { knownDevices } from "../models/devices";

describe("Wallet API methods", () => {
  const knownDevice = knownDevices.nanoX;
  let deviceAction: DeviceAction;

  beforeAll(async () => {
    await app.init({
      userdata: "1AccountBTC1AccountETHReadOnlyFalse",
      knownDevices: [knownDevice],
    });
    await app.dummyWalletApp.startApp();

    await app.portfolio.waitForPortfolioPageToLoad();
    await app.dummyWalletApp.openApp();
    await app.dummyWalletApp.expectApp();
    deviceAction = new DeviceAction(knownDevice);
  });

  afterAll(async () => {
    await app.dummyWalletApp.stopApp();
  });

  afterEach(async () => {
    await app.dummyWalletApp.clearStates();
  });

  it("account.request", async () => {
    await app.dummyWalletApp.sendRequest();
    await app.cryptoDrawer.selectCurrencyFromDrawer("Bitcoin");
    await app.cryptoDrawer.selectAccountFromDrawer("Bitcoin 1 (legacy)");

    const res = await app.dummyWalletApp.getResOutput();
    expect(res).toMatchObject({
      id: "2d23ca2a-069e-579f-b13d-05bc706c7583",
      address: "1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ",
      balance: "35688397",
      blockHeight: 194870,
      currency: "bitcoin",
      name: "Bitcoin 1 (legacy)",
      spendableBalance: "35688397",
    });
  });

  it("account.receive", async () => {
    await app.dummyWalletApp.sendAccountReceive();
    await app.walletAPIReceive.continueWithoutDevice();
    await app.walletAPIReceive.cancelNoDevice();
    await app.walletAPIReceive.continueWithoutDevice();
    await app.walletAPIReceive.confirmNoDevice();

    const res = await app.dummyWalletApp.getResOutput();
    expect(res).toBe("1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ");
  });

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

  xit("transaction.sign", async () => {
    const recipient = "0x046615F0862392BC5E6FB43C92AAD73DE158D235";
    const amount = "500000000000000"; // 0.0005 ETH in wei
    const data = "TestDataForEthereumTransaction";

    await app.dummyWalletApp.setAccountId("e86e3bc1-49e1-53fd-a329-96ba6f1b06d3");
    await app.dummyWalletApp.setRecipient(recipient);
    await app.dummyWalletApp.setAmount(amount);
    await app.dummyWalletApp.setData(data);
    // await app.dummyWalletApp.transactionSign();

    // // Step Fees
    // await expect(page.getByText(/learn more about fees/i)).toBeVisible();
    // await modal.continueToSignTransaction();

    // // Step Recipient
    // await expect(page.getByText(recipient)).toBeVisible();
    // await modal.continueToSignTransaction();

    // // Step Device
    // await deviceAction.silentSign();

    // const res = await app.dummyWalletApp.getResOutput();
    // expect(res).toBe("empty response");
  });

  xit("transaction.sign solana", async () => {
    const recipient = "63M7kPJvLsG46jbR2ZriEU8xwPqkMNKNoBBQ46pobbvo";
    const amount = "1000000"; // 0.001 SOL in lamports

    await app.dummyWalletApp.setAccountId("2fa370fd-2210-5487-b9c9-bc36971ebc72");
    await app.dummyWalletApp.setRecipient(recipient);
    await app.dummyWalletApp.setAmount(amount);
    // await app.dummyWalletApp.transactionSignSolana();

    // // Step Recipient
    // await expect(page.getByText(recipient)).toBeVisible();
    // await modal.continueToSignTransaction();

    // // Step Device
    // await deviceAction.silentSign();

    // const res = await app.dummyWalletApp.getResOutput();
    // expect(res).toMatchObject({
    //   message: {
    //     accountKeys: [
    //       "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
    //       "63M7kPJvLsG46jbR2ZriEU8xwPqkMNKNoBBQ46pobbvo",
    //       "ComputeBudget111111111111111111111111111111",
    //       "11111111111111111111111111111111",
    //     ],
    //     header: {
    //       numReadonlySignedAccounts: 0,
    //       numReadonlyUnsignedAccounts: 2,
    //       numRequiredSignatures: 1,
    //     },
    //     indexToProgramIds: {},
    //     instructions: [
    //       { accounts: [], data: "Fyn5d1", programIdIndex: 2 },
    //       { accounts: [0, 1], data: "3Bxs4Bc3VYuGVB19", programIdIndex: 3 },
    //     ],
    //     recentBlockhash: "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3",
    //   },
    // });
  });

  xit("transaction.sign raw solana simple", async () => {
    const rawTx =
      "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDNzWs4isgmR+LEHY8ZcgBBLMnC4ckD1iuhSa2/Y+69I91oyGFaAZ/9w4srgx9KoqiHtPM6Vur7h4D6XVoSgrEhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALt5JNk+MAN8BXYrlkxMEL1C/sM3+ZFYwZw4eofBOKp4BAgIAAQwCAAAAgJaYAAAAAAA=";

    await app.dummyWalletApp.setAccountId("2fa370fd-2210-5487-b9c9-bc36971ebc72");
    await app.dummyWalletApp.setData(rawTx);
    // await app.dummyWalletApp.transactionSignRawSolana();

    // // Step Recipient
    // await expect(page.getByText("Blind signing required")).toBeVisible();
    // await modal.continueToSignTransaction();

    // // Step Device
    // await deviceAction.silentSign();

    // const res = await app.dummyWalletApp.getResOutput();
    // expect(res).toMatchObject({
    //   message: {
    //     header: {
    //       numRequiredSignatures: 1,
    //       numReadonlySignedAccounts: 0,
    //       numReadonlyUnsignedAccounts: 1,
    //     },
    //     accountKeys: [
    //       "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
    //       "8vCyX7oB6Pc3pbWMGYYZF5pbSnAdQ7Gyr32JqxqCy8ZR",
    //       "11111111111111111111111111111111",
    //     ],
    //     recentBlockhash: "49xM1QggKfcKj2ixPYyAgMfoD3oPne8Fj9WdCLjsLuMo",
    //     instructions: [
    //       {
    //         programIdIndex: 2,
    //         accounts: [0, 1],
    //         data: "3Bxs4NN8M2Yn4TLb",
    //       },
    //     ],
    //     indexToProgramIds: {},
    //   },
    // });
  });

  xit("transaction.sign raw solana simple versioned tx", async () => {
    const rawTx =
      "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQABAzc1rOIrIJkfixB2PGXIAQSzJwuHJA9YroUmtv2PuvSPdaMhhWgGf/cOLK4MfSqKoh7TzOlbq+4eA+l1aEoKxIQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABfLzKkOix18SH7aJB0ftIw4FuVJdpsGNCeSOTPzs9KKAQICAAEMAgAAAICWmAAAAAAAAA==";

    await app.dummyWalletApp.setAccountId("2fa370fd-2210-5487-b9c9-bc36971ebc72");
    await app.dummyWalletApp.setData(rawTx);
    // await app.dummyWalletApp.transactionSignRawSolana();

    // // Step Recipient
    // await expect(page.getByText("Blind signing required")).toBeVisible();
    // await modal.continueToSignTransaction();

    // // Step Device
    // await deviceAction.silentSign();

    // const res = await app.dummyWalletApp.getResOutput();
    // expect(res).toMatchObject({
    //   message: {
    //     header: {
    //       numRequiredSignatures: 1,
    //       numReadonlySignedAccounts: 0,
    //       numReadonlyUnsignedAccounts: 1,
    //     },
    //     staticAccountKeys: [
    //       "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
    //       "8vCyX7oB6Pc3pbWMGYYZF5pbSnAdQ7Gyr32JqxqCy8ZR",
    //       "11111111111111111111111111111111",
    //     ],
    //     recentBlockhash: "2btcs2WqZ7xXxjLsmmBxgNQYUv22EoMzVmSz92KJob13",
    //     compiledInstructions: [
    //       {
    //         programIdIndex: 2,
    //         accountKeyIndexes: [0, 1],
    //         data: {
    //           "0": 2,
    //           "1": 0,
    //           "2": 0,
    //           "3": 0,
    //           "4": 128,
    //           "5": 150,
    //           "6": 152,
    //           "7": 0,
    //           "8": 0,
    //           "9": 0,
    //           "10": 0,
    //           "11": 0,
    //         },
    //       },
    //     ],
    //     addressTableLookups: [],
    //   },
    // });
  });

  xit("transaction.sign raw solana jup", async () => {
    const rawTx =
      "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQADCjc1rOIrIJkfixB2PGXIAQSzJwuHJA9YroUmtv2PuvSPJGEHQWQLekD/dvAcpnMP2/tG3aYY5eJPwCIdQraAPCxEmBJ9MMUfrE0XakyEUZnEtlYyXwSxgHdGjzuUfCe5YlRv0RZO0KA6xpP2ZTy3gPYYekA+GRdTZ9xkFdPoP6mN+PTko52VL0CIM2xtl0WkvNslD6Wawxr7yd9HYllN4Lz1QisC8APtk6AnjCKZmDRfJdI4LPZhcTyQg0m67HXuHf5nhgvgw+u73a6p2g72pShJs/a3e0XIG/SmJess9cE+AwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAEedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTjwbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCpFroxe4U6J5YhwTYIw4Hl0OWWmFfNquad1njJfzq2aU8FBwAFAvWoBAAHAAkDk/ECAAAAAAAIBQUAHQkYCZPxe2T0hK52/Qg/CRsAAwoLBRodCAgZCCEbCgsMDg0PICIfJwkmGxopCgQTEhARJCUjJwkeKhcqFRQECx0pFiobCQkoKgYCAQgcLMEgmzNB1pyBAAMAAAA5XQADTwcAAiZkAgOAhB4AAAAAADGJsAAAAAAAMgAACQMFAAABCQQpv5UHKk+/BN9xdZPnOLzMIScoFcJHGoDZ+fVVsNSEJQIpGAcTACgDAhcVWX05K6qoNBpFvohhQGiBxG4ZEV+GAgS6FrxyNTh9k9oEYAYFZQQDCQIBfcDHFwIcy2bnEz7RejJmfNDT1qvRg9d3bphgF42pbGoEePR08gXxb3l187d006g+ZmeaKFPjpBstjVj8egEUslf/CvI0AyqNtu4dBOPkyscDzsbL";

    await app.dummyWalletApp.setAccountId("2fa370fd-2210-5487-b9c9-bc36971ebc72");
    await app.dummyWalletApp.setData(rawTx);
    // await app.dummyWalletApp.transactionSignRawSolana();

    // // Step Recipient
    // await expect(page.getByText("Blind signing required")).toBeVisible();
    // await modal.continueToSignTransaction();

    // // Step Device
    // await deviceAction.silentSign();

    // const res = await app.dummyWalletApp.getResOutput();
    // expect(res).toMatchObject({
    //   message: {
    //     header: {
    //       numRequiredSignatures: 1,
    //       numReadonlySignedAccounts: 0,
    //       numReadonlyUnsignedAccounts: 3,
    //     },
    //     staticAccountKeys: [
    //       "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
    //       "3T1VPbkDEMTHBUEsPgGFeC5JDcGmPYLo8hMz2zuMQs1D",
    //       "5cmDadKuL5FqJd8gAor15yyML93jWMZE2JFYSeJU4RoF",
    //       "6gc8zvoV4yD5xQufHewkr4mP2ouMGoRVmWCBKAmrroCY",
    //       "HkphEpUqnFBxBuCPEq5j1HA9L8EwmsmRT6UcFKziptM1",
    //       "HWPQWMdTqoPVRZpUULkRMJTbjks21BRiCmvtSFBfrQon",
    //       "J867VvEyqCiwYXJgRLL9VZcjuGr6oNBgWwbN97LjT6RB",
    //       "ComputeBudget111111111111111111111111111111",
    //       "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    //       "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    //     ],
    //     recentBlockhash: "2Xie6kgDVTCMsGYDJXA3h1EDaMRV4Yk3rWy3isWPVyRY",
    //     compiledInstructions: [
    //       {
    //         programIdIndex: 7,
    //         accountKeyIndexes: [],
    //         data: {
    //           "0": 2,
    //           "1": 245,
    //           "2": 168,
    //           "3": 4,
    //           "4": 0,
    //         },
    //       },
    //       {
    //         programIdIndex: 7,
    //         accountKeyIndexes: [],
    //         data: {
    //           "0": 3,
    //           "1": 147,
    //           "2": 241,
    //           "3": 2,
    //           "4": 0,
    //           "5": 0,
    //           "6": 0,
    //           "7": 0,
    //           "8": 0,
    //         },
    //       },
    //       {
    //         programIdIndex: 8,
    //         accountKeyIndexes: [5, 0, 29, 9, 24],
    //         data: {
    //           "0": 147,
    //           "1": 241,
    //           "2": 123,
    //           "3": 100,
    //           "4": 244,
    //           "5": 132,
    //           "6": 174,
    //           "7": 118,
    //           "8": 253,
    //         },
    //       },
    //       {
    //         programIdIndex: 8,
    //         accountKeyIndexes: [
    //           9, 27, 0, 3, 10, 11, 5, 26, 29, 8, 8, 25, 8, 33, 27, 10, 11, 12, 14, 13, 15, 32, 34,
    //           31, 39, 9, 38, 27, 26, 41, 10, 4, 19, 18, 16, 17, 36, 37, 35, 39, 9, 30, 42, 23, 42,
    //           21, 20, 4, 11, 29, 41, 22, 42, 27, 9, 9, 40, 42, 6, 2, 1, 8, 28,
    //         ],
    //         data: {
    //           "0": 193,
    //           "1": 32,
    //           "2": 155,
    //           "3": 51,
    //           "4": 65,
    //           "5": 214,
    //           "6": 156,
    //           "7": 129,
    //           "8": 0,
    //           "9": 3,
    //           "10": 0,
    //           "11": 0,
    //           "12": 0,
    //           "13": 57,
    //           "14": 93,
    //           "15": 0,
    //           "16": 3,
    //           "17": 79,
    //           "18": 7,
    //           "19": 0,
    //           "20": 2,
    //           "21": 38,
    //           "22": 100,
    //           "23": 2,
    //           "24": 3,
    //           "25": 128,
    //           "26": 132,
    //           "27": 30,
    //           "28": 0,
    //           "29": 0,
    //           "30": 0,
    //           "31": 0,
    //           "32": 0,
    //           "33": 49,
    //           "34": 137,
    //           "35": 176,
    //           "36": 0,
    //           "37": 0,
    //           "38": 0,
    //           "39": 0,
    //           "40": 0,
    //           "41": 50,
    //           "42": 0,
    //           "43": 0,
    //         },
    //       },
    //       {
    //         programIdIndex: 9,
    //         accountKeyIndexes: [5, 0, 0],
    //         data: {
    //           "0": 9,
    //         },
    //       },
    //     ],
    //     addressTableLookups: [
    //       {
    //         accountKey: "3oy9ojnsDzqmMNi87Gs7Hn5v3MPVqnWjG9k8BmzKR7yW",
    //         writableIndexes: [41, 24],
    //         readonlyIndexes: [19, 0, 40, 3, 2, 23, 21],
    //       },
    //       {
    //         accountKey: "72L2vpvB2EntpASsx4rG5UhrvC1k4eJX1amRPuVpNX53",
    //         writableIndexes: [96, 6, 5, 101],
    //         readonlyIndexes: [3, 9, 2, 1],
    //       },
    //       {
    //         accountKey: "9TtTSHEvN9HfXQC1VxyqjmuQFAr6JbNJn3nPEv5oVvx1",
    //         writableIndexes: [120, 244, 116, 242],
    //         readonlyIndexes: [241, 111, 121, 117, 243],
    //       },
    //       {
    //         accountKey: "DM8vzXD2dwSoUQXFNcFnhH1QS2hz9AsKV2XpEbZYTDG8",
    //         writableIndexes: [227, 228, 202, 199],
    //         readonlyIndexes: [206, 198, 203],
    //       },
    //     ],
    //   },
    // });
  });
});
