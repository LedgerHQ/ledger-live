import bippath from "bip32-path";
import SpeculosTransportHttp from "@ledgerhq/hw-transport-node-speculos-http";
import Exchange, { ExchangeTypes, PartnerKeyInfo } from "./Exchange";
import Transport from "@ledgerhq/hw-transport";
import { randomBytes, subtle } from "crypto";
import secp256k1 from "secp256k1";
import protobuf from "protobufjs";
import BigNumber from "bignumber.js";

describe("Check Exchange until payload signature", () => {
  let transport: Transport;

  beforeAll(async () => {
    transport = await SpeculosTransportHttp.open({});
  });
  afterAll(async () => {
    transport.close();
  });

  describe("Check SWAP", () => {
    it("Legacy SWAP", async () => {
      // Given
      const exchange = new Exchange(transport, ExchangeTypes.Swap);

      // When
      const transactionId = await exchange.startNewTransaction();

      // Then
      expect(transactionId).toEqual(expect.any(String));
      expect(transactionId).toHaveLength(10);

      const { partnerInfo, partnerSigned, partnerPrivKey } =
        await appExchangeDatasetTest(legacySignFormat);
      await exchange.setPartnerKey(partnerInfo);

      await exchange.checkPartner(partnerSigned);

      const amount = new BigNumber(100000);
      const amountToWallet = new BigNumber(1000);
      const encodedPayload = await generateSwapPayloadProtobuf({
        payinAddress: "0xd692Cb1346262F584D17B4B470954501f6715a82",
        refundAddress: "0xDad77910DbDFdE764fC21FCD4E74D71bBACA6D8D",
        payoutAddress: "bc1qer57ma0fzhqys2cmydhuj9cprf9eg0nw922a8j",
        currencyFrom: "ETH",
        currencyTo: "BTC",
        amountToProvider: Buffer.from(amount.toString(16), "hex"),
        amountToWallet: Buffer.from(amountToWallet.toString(16), "hex"),
        deviceTransactionId: transactionId,
      });
      const estimatedFees = new BigNumber(0);
      await exchange.processTransaction(encodedPayload, estimatedFees);

      const payloadSignature = await signMessage(encodedPayload, partnerPrivKey, "der");
      await exchange.checkTransactionSignature(payloadSignature);
    });

    it("NG SWAP", async () => {
      // Given
      const exchange = new Exchange(transport, ExchangeTypes.SwapNg);

      // When
      const transactionId = await exchange.startNewTransaction();

      // Then
      expect(transactionId).toEqual(expect.any(String));
      expect(transactionId).toHaveLength(64);

      const { partnerInfo, partnerSigned, partnerPrivKey } =
        await appExchangeDatasetTest(ngSignFormat);
      await exchange.setPartnerKey(partnerInfo);

      await exchange.checkPartner(partnerSigned);

      const amount = new BigNumber(100_000);
      const amountToWallet = new BigNumber(100_000_000_000);
      let encodedPayload = await generateSwapPayloadProtobuf({
        payinAddress: "0xd692Cb1346262F584D17B4B470954501f6715a82",
        refundAddress: "0xDad77910DbDFdE764fC21FCD4E74D71bBACA6D8D",
        payoutAddress: "bc1qer57ma0fzhqys2cmydhuj9cprf9eg0nw922a8j",
        currencyFrom: "ETH",
        currencyTo: "BTC",
        amountToProvider: Buffer.from(amount.toString(16), "hex"),
        amountToWallet: Buffer.from(amountToWallet.toString(16), "hex"),
        deviceTransactionIdNg: Buffer.from(transactionId.padStart(32, "0"), "hex"),
      });
      encodedPayload = convertToJWSPayload(encodedPayload);

      const estimatedFees = new BigNumber(0);
      await exchange.processTransaction(encodedPayload, estimatedFees, "jws");

      const payloadSignature = await signMessage(encodedPayload, partnerPrivKey, "rs");
      await exchange.checkTransactionSignature(payloadSignature);
    });

    it("NG SWAP with more than 255 bytes in process transaction", async () => {
      // Given
      const exchange = new Exchange(transport, ExchangeTypes.SwapNg);

      // When
      const transactionId = await exchange.startNewTransaction();

      // Then
      expect(transactionId).toEqual(expect.any(String));
      expect(transactionId).toHaveLength(64);

      const { partnerInfo, partnerSigned, partnerPrivKey } =
        await appExchangeDatasetTest(ngSignFormat);
      await exchange.setPartnerKey(partnerInfo);

      await exchange.checkPartner(partnerSigned);

      const amount = new BigNumber(100_000);
      const amountToWallet = new BigNumber(100_000_000_000);
      // Extra properties have a limited size of 20 (i.e. app-exchange/src/proto/protocol.options)
      let encodedPayload = await generateSwapPayloadProtobuf({
        payinAddress: "0xd692Cb1346262F584D17B4B470954501f6715a82",
        payinExtraId: '{ extraInfo: "Go" }',
        refundAddress: "0xDad77910DbDFdE764fC21FCD4E74D71bBACA6D8D",
        refundExtraId: '{ extraInfo: "Go" }',
        payoutAddress: "bc1qer57ma0fzhqys2cmydhuj9cprf9eg0nw922a8j",
        payoutExtraId: "bc1qer57ma0fzhqys2c",
        currencyFrom: "ETH",
        currencyTo: "BTC",
        amountToProvider: Buffer.from(amount.toString(16), "hex"),
        amountToWallet: Buffer.from(amountToWallet.toString(16), "hex"),
        deviceTransactionIdNg: Buffer.from(transactionId.padStart(32, "0"), "hex"),
      });
      encodedPayload = convertToJWSPayload(encodedPayload);

      const estimatedFees = new BigNumber(0);
      await exchange.processTransaction(encodedPayload, estimatedFees, "jws");
      console.log("DEBUG - SWAP partner encoded payload:", encodedPayload.toString("hex"));

      const payloadSignature = await signMessage(encodedPayload, partnerPrivKey, "rs");
      console.log(
        "DEBUG - SWAP partner payload signature:",
        Buffer.from(payloadSignature).toString("hex"),
      );
      await exchange.checkTransactionSignature(payloadSignature);
    });

    it("NG SWAP with prepared data", async () => {
      // Given
      const exchange = new Exchange(transport, ExchangeTypes.SwapNg);

      // When
      const transactionId = await exchange.startNewTransaction();

      // Then
      expect(transactionId).toEqual(expect.any(String));
      expect(transactionId).toHaveLength(64);

      const { partnerInfo, partnerSigned, apdu } = await appExchangeDataset(ngSignFormat);
      await exchange.setPartnerKey(partnerInfo);

      console.log("DEBUG - Swap partner APDU:", apdu.toString("hex"));
      console.log("DEBUG - Swap partner signed:", Buffer.from(partnerSigned).toString("hex"));

      await exchange.checkPartner(partnerSigned);

      const encodedPayload = Buffer.from(
        ".CipiYzFxYXIwc3Jycjd4Zmt2eTVsNjQzbHlkbnc5cmU1OWd0enp3ZjVtZHEaKmJjMXFhcjBzcnJyN3hma3Z5NWw2NDNseWRudzlyZTU5Z3R6endmNHRlcSoqMHhiNzk0ZjVlYTBiYTM5NDk0Y2U4Mzk2MTNmZmZiYTc0Mjc5NTc5MjY4OgNCVENCA0JBVEoCBH5SBgV0-95gAGIgNQrqDJf3R_HQ92CBRhSkdSOAGxrrfQvLuqKk9Gv4GEs=",
      );

      const estimatedFees = new BigNumber(0);
      await exchange.processTransaction(encodedPayload, estimatedFees, "jws");
      console.log("DEBUG - SWAP partner encoded payload:", encodedPayload.toString("hex"));

      // const payloadSignature = await signMessage(encodedPayload, partnerPrivKey, "rs");
      const payloadSignature = Buffer.from(
        "zGcNUYKM8sLxvT7zPU1C8vrMmanVlUroELnAeil4weo1LCk0zUBRse5-3Acv7I7II90xVTIxm26BnxRbZvVmTQ==",
        "base64url",
      );
      console.log(
        "DEBUG - SWAP partner payload signature:",
        Buffer.from(payloadSignature).toString("hex"),
      );
      await exchange.checkTransactionSignature(payloadSignature);
    });

    it("NG SWAP with TON", async () => {
      // Given
      const exchange = new Exchange(transport, ExchangeTypes.SwapNg);

      // When
      const transactionId = await exchange.startNewTransaction();

      // Then
      expect(transactionId).toEqual(expect.any(String));
      expect(transactionId).toHaveLength(64);

      const { partnerInfo, partnerSigned, apdu, partnerPrivKey } =
        await appExchangeDatasetTest(ngSignFormat);
      await exchange.setPartnerKey(partnerInfo);

      console.log("DEBUG - Swap partner APDU:", apdu.toString("hex"));
      console.log("DEBUG - Swap partner signed:", Buffer.from(partnerSigned).toString("hex"));

      await exchange.checkPartner(partnerSigned);

      const amount = new BigNumber(100);
      const amountToWallet = new BigNumber(1_000);
      // Extra properties have a limited size of 20 (i.e. app-exchange/src/proto/protocol.options)
      let encodedPayload = await generateSwapPayloadProtobuf({
        payinAddress: "UQAbvs2tCnsTWxCZX7JW-dqlk0vM8x_m8aJqF4wwRWGtTEZD",
        refundAddress: "UQAbvs2tCnsTWxCZX7JW-dqlk0vM8x_m8aJqF4wwRWGtTEZD",
        payoutAddress: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
        // payinAddress: "UQCa_2bcwBt5eH9gOMgHC497nyfjgSl8hGpZ90O7B17WHA==",
        // refundAddress: "UQCa_2bcwBt5eH9gOMgHC497nyfjgSl8hGpZ90O7B17WHA==",
        // payoutAddress: "0xDad77910DbDFdE764fC21FCD4E74D71bBACA6D8D",
        currencyFrom: "TON",
        currencyTo: "ETH",
        amountToProvider: Buffer.from(amount.toString(16), "hex"),
        amountToWallet: Buffer.from(amountToWallet.toString(16), "hex"),
        deviceTransactionIdNg: Buffer.from(transactionId.padStart(32, "0"), "hex"),
      });
      encodedPayload = convertToJWSPayload(encodedPayload);

      const estimatedFees = new BigNumber(0);
      await exchange.processTransaction(encodedPayload, estimatedFees, "jws");
      console.log("DEBUG - SWAP partner encoded payload:", encodedPayload.toString("hex"));

      const payloadSignature = await signMessage(encodedPayload, partnerPrivKey, "rs");
      console.log(
        "DEBUG - SWAP partner payload signature:",
        Buffer.from(payloadSignature).toString("hex"),
      );
      await exchange.checkTransactionSignature(payloadSignature);

      const configEth = {
        config: Buffer.from("0345544808457468657265756d050345544812", "hex"),
        signature: Buffer.from(
          "3044022065d7931ab3144362d57e3fdcc5de921fb65024737d917f0ab1f8b173d1ed3c2e022027493568d112dc53c7177f8e5fc915d91a903780a067badf109085a73d360323",
          "hex",
        ),
      };
      let addressParameters = bip32asBuffer("44'/60'/0'/0/0");
      await exchange.validatePayoutOrAsset(
        configEth.config,
        configEth.signature,
        addressParameters,
      );

      const delay = (milliseconds: number) => {
        return new Promise(resolve => {
          setTimeout(resolve, milliseconds);
        });
      };
      await delay(500);

      const configTon = {
        config: Buffer.from("03544f4e03544f4e00", "hex"),
        signature: Buffer.from(
          "3045022100b35be5d1ad0d71572b5f3d72b40766521d5492fad6ed54289a64488bec3344a902205b522b7b8c7c800826bcd0bda092e84db5d1c23f6061c8b57c8efb3641d243a7",
          "hex",
        ),
      };
      addressParameters = bip32asBuffer("44'/607'/0'/0'/0'/0'");
      await exchange.checkRefundAddress(configTon.config, configTon.signature, addressParameters);
    });
  });

  describe("Check SELL", () => {
    it("NG Sell", async () => {
      // Given
      const exchange = new Exchange(transport, ExchangeTypes.SellNg);

      // When
      const transactionId = await exchange.startNewTransaction();

      // Then
      expect(transactionId).toEqual(expect.any(String));
      expect(transactionId).toHaveLength(64);

      const { partnerInfo, partnerSigned, partnerPrivKey, apdu } =
        await appExchangeSellDataset(ngSignFormat);
      await exchange.setPartnerKey(partnerInfo);
      console.log("DEBUG - Sell partner pubkey:", partnerInfo.publicKey.toString("hex"));
      console.log("DEBUG - Sell partner APDU:", apdu.toString("hex"));
      console.log("DEBUG - Sell partner signed:", Buffer.from(partnerSigned).toString("hex"));

      await exchange.checkPartner(partnerSigned);

      const amount = new BigNumber(100_000);
      let encodedPayload = await generateSellPayloadProtobuf({
        traderEmail: "test@ledger.fr",
        inCurrency: "ETH",
        inAmount: Buffer.from(amount.toString(16), "hex"),
        inAddress: "0xd692Cb1346262F584D17B4B470954501f6715a82",
        outCurrency: "EUR",
        outAmount: {
          coefficient: Buffer.from("1", "hex"),
          exponent: 1,
        },
        deviceTransactionId: Buffer.from(transactionId.padStart(32, "0"), "hex"),
      });
      encodedPayload = convertToJWSPayload(encodedPayload);

      const estimatedFees = new BigNumber(0);
      await exchange.processTransaction(encodedPayload, estimatedFees, "jws");
      console.log("DEBUG - SELL partner encoded payload:", encodedPayload.toString("hex"));

      const payloadSignature = await signMessage(encodedPayload, partnerPrivKey, "rs");
      console.log(
        "DEBUG - SELL partner payload signature:",
        Buffer.from(payloadSignature).toString("hex"),
      );
      await exchange.checkTransactionSignature(payloadSignature);
    });
  });
});

describe("Test internal sign and verification functionality", () => {
  describe("With Ledger keys", () => {
    const privKey = Buffer.from(
      "b1ed47ef58f782e2bc4d5abe70ef66d9009c2957967017054470e0f3e10f5833",
      "hex",
    );
    const pubKey = Buffer.from(
      "0420da62003c0ce097e33644a10fe4c30454069a4454f0fa9d4e84f45091429b5220af9e35c0b2d9289380137307de4dd1d418428cf21a93b33561bb09d88fe579",
      "hex",
    );

    test("simple signature", async () => {
      // Given
      const msg = "Something important to cipher";

      // When
      const sig = await signMessage(Buffer.from(msg), privKey, "rs");
      console.log("DEBUG - Test internal: message signature", Buffer.from(sig).toString("hex"));

      // Then
      const hashBuffer = await subtle.digest("SHA-256", Buffer.from(msg));
      const hash = new Uint8Array(hashBuffer);
      expect(secp256k1.ecdsaVerify(sig, hash, pubKey)).toBeTruthy();
    });
    test("APDU signature generated by this test suite", async () => {
      // Given
      const msg =
        "0953454c4c5f54455354000478d5facdae2305f48795d3ce7d9244f5060d2f800901da5746d1f4177ae8d7bbe63f3870efc0d36af8f91962811e1d8d9df91ce3b3ea2cd9f550c7d465f8b7b3";

      // When
      const sig = Buffer.from(
        "30440220471b035b40dafa095d615998c82202b2bd00fb45670b828f1dda3b68e5b24cc3022022a1c64d02b8c14e1e4cc2d05b00234642c11db3d4461ff5366f5af337cf0ced",
        "hex",
      );

      // Then
      const hashBuffer = await subtle.digest("SHA-256", Buffer.from(msg, "hex"));
      const hash = new Uint8Array(hashBuffer);
      expect(secp256k1.ecdsaVerify(convertSignatureFromDER(sig), hash, pubKey)).toBeTruthy();
    });
    test("APDU signature generated by external tool", async () => {
      // Given
      // {"name":"TEST_PROVIDER","payloadSignatureComputedFormat":"jws","publicKey":{"curve":"secp256r1","data":"047c13debdb9e1afac5a82bbe78da6dca98a2e59af8a9a3f827acb8ed325c79a6c5749eff65d4e3470bd2995def771f45426c58eada7227d536feeffb58fa71c24"},"service":{"appVersion":2,"name":"swap"},"signature":"3045022072e6773318af531e478c40f53815d2fa0a1c06c49519bb693ff234662fb6558802210083ab26162da41d3c429dd10051f565440576193031eb0590a9ea200af987f062"}
      const msg =
        "0d544553545f50524f564944455201047c13debdb9e1afac5a82bbe78da6dca98a2e59af8a9a3f827acb8ed325c79a6c5749eff65d4e3470bd2995def771f45426c58eada7227d536feeffb58fa71c24";
      const apdu = ngSignFormat({
        name: "TEST_PROVIDER",
        curve: "secp256r1",
        publicKey: Buffer.from(
          "047c13debdb9e1afac5a82bbe78da6dca98a2e59af8a9a3f827acb8ed325c79a6c5749eff65d4e3470bd2995def771f45426c58eada7227d536feeffb58fa71c24",
          "hex",
        ),
        // signatureComputedFormat?: PayloadSignatureComputedFormat;
      });
      console.log("DEBUG - Test internal: expected APDU to sign\t", apdu.toString("hex"));
      console.log("DEBUG - Test internal: APDU to sign\t", msg);

      // When
      // const sig = Buffer.from(
      //   "3045022068e5971fdad78583e7bb28adac09212108966fd2ed4f8ad206499bca59f0ad12022100aed715d306f772524b805dd4f91afc79b4bda1a14f91d90ea78739e05461d6c7",
      //   "hex",
      // );
      const sig = await signMessage(Buffer.from(msg, "hex"), LEDGER_FAKE_PRIVATE_KEY, "der");
      console.log("DEBUG - Test internal: message signature", Buffer.from(sig).toString("hex"));

      // Then
      const hashBuffer = await subtle.digest("SHA-256", Buffer.from(msg, "hex"));
      const hash = new Uint8Array(hashBuffer);
      expect(secp256k1.ecdsaVerify(convertSignatureFromDER(sig), hash, pubKey)).toBeTruthy();
    });
    test("APDU signature already validated", async () => {
      // Given
      const msg = legacySignFormat({
        name: "Coinify",
        curve: "secp256r1",
        publicKey: Buffer.from(
          "044f22668f5f321d3784266c932a2a3141c3ec196ddd51f42cf975267eda23d3a8b02170e4c5c70536e7d03ba4e66ee3e1f9d65e772d3217871a830a7cf60da366",
          "hex",
        ),
        // signatureComputedFormat?: PayloadSignatureComputedFormat;
      });
      console.log("DEBUG - Test internal: APDU to sign", msg.toString("hex"));

      // When
      const sig = Buffer.from(
        "30450221008e8b2172ddd48e196dbff81ebe8aebc4ec0988f72de1b02da202f3a8d8f33f9c02205273c1d426aeb460fd36a27696aafda68bdff4139886f29e558895ea85527749",
        "hex",
      );
      // const sig = await signMessage(Buffer.from(msg, "hex"), LEDGER_FAKE_PRIVATE_KEY, "der");
      console.log("DEBUG - Test internal: message signature", Buffer.from(sig).toString("hex"));

      // Then
      const hashBuffer = await subtle.digest("SHA-256", msg);
      const hash = new Uint8Array(hashBuffer);
      expect(secp256k1.ecdsaVerify(convertSignatureFromDER(sig), hash, pubKey)).toBeTruthy();
    });
  });

  describe("With SELL keys", () => {
    const privKey = Buffer.from(
      "308f6a5369aea611d89abf937d0ffaf0b43b457d42cbf0cf754786b3088f17ae",
      "hex",
    );
    const pubKey = Buffer.from(
      "0478d5facdae2305f48795d3ce7d9244f5060d2f800901da5746d1f4177ae8d7bbe63f3870efc0d36af8f91962811e1d8d9df91ce3b3ea2cd9f550c7d465f8b7b3",
      "hex",
    );

    test("SELL private and public K1 key pair", async () => {
      // Given
      const msg = "Something important to cipher";

      // When
      const sig = await signMessage(Buffer.from(msg), privKey, "rs");
      console.log("DEBUG - Test internal: message signature", Buffer.from(sig).toString("hex"));

      // Then
      const hashBuffer = await subtle.digest("SHA-256", Buffer.from(msg));
      const hash = new Uint8Array(hashBuffer);
      expect(secp256k1.ecdsaVerify(sig, hash, pubKey)).toBeTruthy();
    });

    test("SELL verify payload signature", async () => {
      // Given
      const msg =
        "2e436735305a584e305147786c5a47646c6369356d636849445256524947674959616949714d48686b4e6a6b79513249784d7a51324d6a5979526a55344e4551784e304930516a51334d446b314e4455774d5759324e7a4531595467794b674e465656497942416f41454145364944554b366779583930667830506467675559557048556a674273613633304c79377169705052722d42684c";

      // When
      const sig = Buffer.from(
        "348e938ce75c06da9a27652c2af6146b4581f948c600b4f7093743e8af256d172324131dcc852f068d0bd20afd0c8444bc635e9520d3a29cab7ff7c27dc8b782",
        "hex",
      );
      console.log("DEBUG - Test internal: message signature", Buffer.from(sig).toString("hex"));

      // Then
      const hashBuffer = await subtle.digest("SHA-256", Buffer.from(msg, "hex"));
      const hash = new Uint8Array(hashBuffer);
      expect(secp256k1.ecdsaVerify(sig, hash, pubKey)).toBeTruthy();
    });
  });
});

// Those information comes from dataset test of app-exchange (i.e. check signing_authority.py file).
// The public key is bundle with DEBUG version of app-exchange.
const LEDGER_FAKE_PRIVATE_KEY = Buffer.from(
  "b1ed47ef58f782e2bc4d5abe70ef66d9009c2957967017054470e0f3e10f5833",
  "hex",
);

type PartnerSignFormat = (PartnerKeyInfo) => Buffer;
const legacySignFormat: PartnerSignFormat = (info: PartnerKeyInfo) => {
  return Buffer.concat([
    Buffer.from([info.name.length]),
    Buffer.from(info.name, "ascii"),
    info.publicKey,
  ]);
};
const curves = {
  secp256k1: 0x00,
  secp256r1: 0x01,
};
const ngSignFormat: PartnerSignFormat = (info: PartnerKeyInfo) => {
  return Buffer.concat([
    Buffer.from([info.name.length]),
    Buffer.from(info.name, "ascii"),
    Buffer.from([curves[info.curve]]),
    info.publicKey,
  ]);
};
async function appExchangeDatasetTest(signFormat: PartnerSignFormat) {
  // Generate random provider key
  let privKey;
  do {
    privKey = randomBytes(32);
  } while (!secp256k1.privateKeyVerify(privKey));
  // The expected public should not be compressed and be a full 64 length (with R and S)
  const isCompressed = false;
  const pubKey = secp256k1.publicKeyCreate(privKey, isCompressed);

  const partnerInfo = {
    name: "SWAP_TEST",
    curve: "secp256k1",
    publicKey: pubKey,
  };
  const msg = signFormat(partnerInfo);

  const sig = await signMessage(msg, LEDGER_FAKE_PRIVATE_KEY, "der");

  return {
    partnerInfo,
    apdu: msg,
    partnerSigned: sig,
    partnerPrivKey: privKey,
  };
}
async function appExchangeDataset(signFormat: PartnerSignFormat) {
  const pubKey = Buffer.from(
    "0478d5facdae2305f48795d3ce7d9244f5060d2f800901da5746d1f4177ae8d7bbe63f3870efc0d36af8f91962811e1d8d9df91ce3b3ea2cd9f550c7d465f8b7b3",
    "hex",
  );
  secp256k1.publicKeyVerify(pubKey);

  const partnerInfo = {
    name: "SWAP_TEST",
    curve: "secp256k1",
    publicKey: pubKey,
  };
  const msg = signFormat(partnerInfo);

  const sig = await signMessage(msg, LEDGER_FAKE_PRIVATE_KEY, "der");

  return {
    partnerInfo,
    apdu: msg,
    partnerSigned: sig,
  };
}
async function appExchangeSellDataset(signFormat: PartnerSignFormat) {
  const privKey = Buffer.from(
    "308f6a5369aea611d89abf937d0ffaf0b43b457d42cbf0cf754786b3088f17ae",
    "hex",
  );
  const pubKey = Buffer.from(
    "0478d5facdae2305f48795d3ce7d9244f5060d2f800901da5746d1f4177ae8d7bbe63f3870efc0d36af8f91962811e1d8d9df91ce3b3ea2cd9f550c7d465f8b7b3",
    "hex",
  );
  secp256k1.publicKeyVerify(pubKey);

  const partnerInfo = {
    name: "SELL_TEST",
    curve: "secp256k1",
    publicKey: pubKey,
  };
  const msg = signFormat(partnerInfo);

  const sig = await signMessage(msg, LEDGER_FAKE_PRIVATE_KEY, "der");

  return {
    partnerInfo,
    apdu: msg,
    partnerSigned: sig,
    partnerPrivKey: privKey,
  };
}
type SwapPayloadCore = {
  payinAddress: string;
  payinExtraId?: string;
  refundAddress: string;
  refundExtraId?: string;
  payoutAddress: string;
  payoutExtraId?: string;
  currencyFrom: string;
  currencyTo: string;
  amountToProvider: Buffer;
  amountToWallet: Buffer;
};
type SwapPayloadLegacy = SwapPayloadCore & {
  deviceTransactionId?: string;
};
type SwapPayloadNg = SwapPayloadCore & {
  deviceTransactionIdNg?: Buffer;
};
type SwapPayload = SwapPayloadLegacy | SwapPayloadNg;
async function generateSwapPayloadProtobuf(payload: SwapPayload): Promise<Buffer> {
  const root = await protobuf.load("protocol.proto");
  const TransactionResponse = root.lookupType("ledger_swap.NewTransactionResponse");
  const err = TransactionResponse.verify(payload);
  if (err) {
    throw Error(err);
  }
  const message = TransactionResponse.create(payload);
  const messageEncoded = TransactionResponse.encode(message).finish();

  return Buffer.from(messageEncoded);
}

type UDecimal = {
  coefficient: Buffer;
  exponent: number;
};
type SellPayload = {
  traderEmail: string;
  inCurrency: string;
  inAmount: Buffer;
  inAddress: string;
  outCurrency: string;
  outAmount: UDecimal;
  deviceTransactionId: Buffer;
};
async function generateSellPayloadProtobuf(payload: SellPayload): Promise<Buffer> {
  const root = await protobuf.load("protocol.proto");
  const SellResponse = root.lookupType("ledger_swap.NewSellResponse");
  const err = SellResponse.verify(payload);
  if (err) {
    throw Error(err);
  }
  const message = SellResponse.create(payload);
  const messageEncoded = SellResponse.encode(message).finish();

  return Buffer.from(messageEncoded);
}

type SigFormat = "der" | "rs";
// Sign message in ECDSA-SHA256 with secp256k1 curve and returnsa DER format signature
async function signMessage(
  message: Buffer,
  privKey: Buffer,
  sigFormat: SigFormat,
): Promise<Buffer> {
  const hashBuffer = await subtle.digest("SHA-256", message);
  const hash = new Uint8Array(hashBuffer);

  const sig = secp256k1.ecdsaSign(hash, privKey).signature;
  if (sigFormat === "der") {
    return convertSignatureToDER(sig);
  }
  return sig;
}

function convertSignatureToDER(sig: Uint8Array): Buffer {
  return secp256k1.signatureExport(sig);
}

// Convert raw buffer to a JWS compatible one: '.'+base64Url(raw)
function convertToJWSPayload(raw: Buffer): Buffer {
  return Buffer.from("." + raw.toString("base64url"));
}

function convertSignatureFromDER(sig: Uint8Array): Buffer {
  return secp256k1.signatureImport(sig);
}

function bip32asBuffer(path: string): Buffer {
  const pathElements = !path ? [] : bippath.fromString(path).toPathArray();

  const buffer = Buffer.alloc(1 + pathElements.length * 4);
  buffer[0] = pathElements.length;
  pathElements.forEach((element, index) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });
  return buffer;
}
