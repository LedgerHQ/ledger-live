import bippath from "bip32-path";
import SpeculosTransportHttp from "@ledgerhq/hw-transport-node-speculos-http";
import Exchange, { ExchangeTypes, PartnerKeyInfo } from "./Exchange";
import Transport from "@ledgerhq/hw-transport";
import { randomBytes, subtle } from "crypto";
import secp256k1 from "secp256k1";
import protobuf from "protobufjs";
import BigNumber from "bignumber.js";

describe("Check SWAP until payload signature", () => {
  let transport: Transport;

  beforeAll(async () => {
    transport = await SpeculosTransportHttp.open({});
  });
  afterAll(async () => {
    transport.close();
  });

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

    const payloadSignature = await signMessage(encodedPayload, partnerPrivKey, "rs");
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

    const { partnerInfo, partnerSigned } = await appExchangeDataset(ngSignFormat);
    await exchange.setPartnerKey(partnerInfo);

    await exchange.checkPartner(partnerSigned);

    const encodedPayload = Buffer.from(
      ".CipiYzFxYXIwc3Jycjd4Zmt2eTVsNjQzbHlkbnc5cmU1OWd0enp3ZjVtZHEaKmJjMXFhcjBzcnJyN3hma3Z5NWw2NDNseWRudzlyZTU5Z3R6endmNHRlcSoqMHhiNzk0ZjVlYTBiYTM5NDk0Y2U4Mzk2MTNmZmZiYTc0Mjc5NTc5MjY4OgNCVENCA0JBVEoCBH5SBgV0-95gAGIgNQrqDJf3R_HQ92CBRhSkdSOAGxrrfQvLuqKk9Gv4GEs=",
    );

    const estimatedFees = new BigNumber(0);
    await exchange.processTransaction(encodedPayload, estimatedFees, "jws");

    // const payloadSignature = await signMessage(encodedPayload, partnerPrivKey, "rs");
    const payloadSignature = Buffer.from(
      "zGcNUYKM8sLxvT7zPU1C8vrMmanVlUroELnAeil4weo1LCk0zUBRse5-3Acv7I7II90xVTIxm26BnxRbZvVmTQ==",
      "base64url",
    );
    await exchange.checkTransactionSignature(payloadSignature);
  });

  it("NG Sell", async () => {
    // Given
    const exchange = new Exchange(transport, ExchangeTypes.SellNg);

    // When
    const transactionId = await exchange.startNewTransaction();

    // Then
    expect(transactionId).toEqual(expect.any(String));
    expect(transactionId).toHaveLength(64);

    const { partnerInfo, partnerSigned, partnerPrivKey } =
      await appExchangeSellDataset(ngSignFormat);
    await exchange.setPartnerKey(partnerInfo);
    console.log("DEBUG - Sell partner info:", partnerInfo);
    console.log("DEBUG - Sell partner info:", partnerInfo.publicKey.toString("hex"));
    console.log("DEBUG - Sell partner signed:", Buffer.from(partnerSigned).toString("hex"));

    await exchange.checkPartner(partnerSigned);

    // const amount = BigInt(10_000_000_000_000_000); // In Wei (or the smallest unit of the coin), i.e. 0.01 ETH
    const amount = BigInt(4_120_000_000_000_000_000); // 4.12 ETH

    const outAmount = BigInt(1234); // 12.34 EUR
    const b = new ArrayBuffer(8);
    new DataView(b).setBigUint64(0, outAmount);
    const bufOutAmount = Buffer.from(new Uint8Array(b));

    let encodedPayload = await generateSellPayloadProtobuf({
      traderEmail: "test@ledger.fr",
      inCurrency: "ETH",
      inAmount: Buffer.from(amount.toString(16), "hex"),
      inAddress: "0xd692Cb1346262F584D17B4B470954501f6715a82",
      outCurrency: "EUR",
      outAmount: {
        coefficient: bufOutAmount,
        exponent: 2,
      },
      deviceTransactionId: Buffer.from(transactionId.padStart(32, "0"), "hex"),
    });
    encodedPayload = convertToJWSPayload(encodedPayload);
    console.log("SELL Payload in base64:", encodedPayload.toString());

    const estimatedFees = new BigNumber(0);
    await exchange.processTransaction(encodedPayload, estimatedFees, "jws");

    const payloadSignature = await signMessage(encodedPayload, partnerPrivKey, "rs");
    await exchange.checkTransactionSignature(payloadSignature);

    const configEth = {
      config: Buffer.from("0345544808457468657265756d050345544812", "hex"),
      signature: Buffer.from(
        "3044022065d7931ab3144362d57e3fdcc5de921fb65024737d917f0ab1f8b173d1ed3c2e022027493568d112dc53c7177f8e5fc915d91a903780a067badf109085a73d360323",
        "hex",
      ),
    };
    const addressParameters = bip32asBuffer("44'/60'/0'/0/0");
    exchange.checkPayoutAddress(configEth.config, configEth.signature, addressParameters);
  });

  it("NG Sell with prepared data", async () => {
    // Given
    const exchange = new Exchange(transport, ExchangeTypes.SellNg);

    // When
    const transactionId = await exchange.startNewTransaction();

    // Then
    expect(transactionId).toEqual(expect.any(String));
    expect(transactionId).toHaveLength(64);

    const { partnerInfo, partnerSigned } = await appExchangeSellDataset(ngSignFormat);
    await exchange.setPartnerKey(partnerInfo);

    await exchange.checkPartner(partnerSigned);

    const encodedPayload = Buffer.from(
      ".ChxzYXJhLm5laWxhLWppbWVuZXpAbGVkZ2VyLmZyEgNCVEMaBAAIK1YiIzJOQTVSZ3U4elhUQnZVTkZwbm1qc0RDaTd2eFVtdmRQODhQKgNFVVIyDAoIAAAAAAAAdTAQAjogNQrqDJf3R_HQ92CBRhSkdSOAGxrrfQvLuqKk9Gv4GEs=",
    );

    const estimatedFees = new BigNumber(0);
    await exchange.processTransaction(encodedPayload, estimatedFees, "jws");

    // const payloadSignature = await signMessage(encodedPayload, partnerPrivKey, "rs");
    const payloadSignature = Buffer.from(
      "XzscgDTYa33fxi0yjSN-NtIn9YaIUzRB4VbkIFOUM7fol_7pM5dREuH623DKq5BUMRZNdUrnazS2NlArRyvHUA==",
      "base64url",
    );
    await exchange.checkTransactionSignature(payloadSignature);

    // const configBtc = {
    //   config: Buffer.from("0342544307426974636f696e00", "hex"),
    //   signature: Buffer.from(
    //     "3045022100cb174382302219dca359c0a4d457b2569e31a06b2c25c0088a2bd3fd6c04386a02202c6d0a5b924a414621067e316f021aa13aa5b2eee2bf36ea3cfddebc053b201b",
    //     "hex",
    //   ),
    // };
    const configBtcTesnet = {
      config: Buffer.from([
        0x3, 0x42, 0x54, 0x43, 0xc, 0x42, 0x69, 0x74, 0x63, 0x6f, 0x69, 0x6e, 0x20, 0x54, 0x65,
        0x73, 0x74, 0x0,
      ]),
      signature: Buffer.from([
        0x30, 0x45, 0x2, 0x21, 0x0, 0xa5, 0x37, 0xd3, 0x11, 0x8a, 0x9c, 0xd8, 0x94, 0x74, 0x4a,
        0x4f, 0xd5, 0x5c, 0xb7, 0x3d, 0x4f, 0xb2, 0x60, 0xfc, 0xf4, 0x6d, 0x8f, 0xc8, 0xed, 0x2a,
        0xe6, 0x5e, 0x6c, 0x68, 0x44, 0x55, 0xab, 0x2, 0x20, 0x39, 0x2a, 0xf5, 0x7f, 0xbc, 0x57,
        0x7d, 0xf5, 0xd1, 0xfe, 0x4d, 0x7d, 0x57, 0xee, 0xea, 0x76, 0x82, 0x44, 0xf2, 0xa5, 0x76,
        0x7d, 0xd9, 0x82, 0x90, 0x4, 0xfe, 0x6f, 0x1d, 0x0, 0x3a, 0x58,
      ]),
    };
    const addressParameters = bip32asBuffer("84'/0'/0'/0/1");
    exchange.checkPayoutAddress(
      configBtcTesnet.config,
      configBtcTesnet.signature,
      addressParameters,
    );
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
const ngSignFormat: PartnerSignFormat = (info: PartnerKeyInfo) => {
  return Buffer.concat([
    Buffer.from([info.name.length]),
    Buffer.from(info.name, "ascii"),
    Buffer.from([0x00]),
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

function bip32asBuffer(path: string): Buffer {
  const pathElements = !path ? [] : bippath.fromString(path).toPathArray();

  const buffer = Buffer.alloc(1 + pathElements.length * 4);
  buffer[0] = pathElements.length;
  pathElements.forEach((element, index) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });
  return buffer;
}