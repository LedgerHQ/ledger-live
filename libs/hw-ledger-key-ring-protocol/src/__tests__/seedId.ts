import { crypto } from "../Crypto";
import { Challenge, PubKeyCredential } from "../SeedId";

describe("PubKeyCredential regular cases", () => {
  const rpPubKeyCredential = new PubKeyCredential({
    version: 0,
    curveId: 0x21,
    signAlgorithm: 0x01,
    publicKey: crypto.from_hex(
      "02b2c29ab36022219967cc21a306599ecaf51ce9f2998da6982388d52c8c69a6a5",
    ),
  });

  test("assertValidity", () => {
    expect(() => rpPubKeyCredential.assertValidity()).not.toThrow();
  });

  test("toJSON", () => {
    expect(rpPubKeyCredential.toJSON()).toEqual({
      version: 0,
      curveId: 33,
      signAlgorithm: 1,
      publicKey: "02b2c29ab36022219967cc21a306599ecaf51ce9f2998da6982388d52c8c69a6a5",
    });
  });

  test("toBytes", () => {
    expect(crypto.to_hex(rpPubKeyCredential.toBytes())).toEqual(
      "0021012102b2c29ab36022219967cc21a306599ecaf51ce9f2998da6982388d52c8c69a6a5",
    );
  });

  test("fromBytes", () => {
    expect(
      PubKeyCredential.fromBytes(
        crypto.from_hex(
          "0021012102b2c29ab36022219967cc21a306599ecaf51ce9f2998da6982388d52c8c69a6a5",
        ),
      ),
    ).toEqual([rpPubKeyCredential, 37]);
  });

  test("toBytes into fromBytes", () => {
    const bytes = rpPubKeyCredential.toBytes();
    const [pubKeyCredential, _] = PubKeyCredential.fromBytes(bytes);
    expect(pubKeyCredential).toEqual(rpPubKeyCredential);
  });
});

describe("Challenge regular cases", () => {
  const rpPubKeyCredential = new PubKeyCredential({
    version: 0,
    curveId: 0x21,
    signAlgorithm: 0x01,
    publicKey: crypto.from_hex(
      "02b2c29ab36022219967cc21a306599ecaf51ce9f2998da6982388d52c8c69a6a5",
    ),
  });

  const challengeData = crypto.from_hex("53cafde60e5395b164eb867213bc05f6");
  const rpSignature = crypto.from_hex(
    "3045022025d130d7ae5c48a6cf09781d04a08e9a2d07ce1bd17e84637f6ede4a043c5dcc022100a846ececf20eb53ffc2dc502ce8074ba40b241bfd13edaf1e8575559a9b2b4ea",
  );

  const challenge = new Challenge({
    payloadType: 0x07,
    version: 0,
    protocolVersion: {
      major: 1,
      minor: 0,
      patch: 0,
    },
    challengeData: challengeData,
    challengeExpiry: new Date(1708678950000),
    host: "localhost",
    rpCredential: rpPubKeyCredential,
    rpSignature: rpSignature,
  });

  test("parse one example from backend", () => {
    const hex =
      "01010702010012102d4492d50ef878a450d9bd6e8862690014010115483046022100beb271fa9752c377251005e125cc115737e427d5259a2dbbc9a38f7a36430c3f0221008826b3d3c1b491b41908d7cc89d71b92e9428c52a927e95341d555252f687b0f16046654aea120096c6f63616c686f7374320121332103cb7628e7248ddf9c07da54b979f16bf081fb3d173aac0992ad2a44ef6a388ae2600401000000";
    const bytes = crypto.from_hex(hex);
    const [challengeFromBytes, l] = Challenge.fromBytes(bytes);
    expect(l).toEqual(bytes.length);

    expect(challengeFromBytes.toJSON()).toEqual({
      payloadType: 7,
      version: 0,
      challenge: { data: "2d4492d50ef878a450d9bd6e88626900", expiry: "2024-05-27T16:02:41.000Z" },
      host: "localhost",
      rp: [
        {
          credential: {
            version: 0,
            curveId: 33,
            signAlgorithm: 1,
            publicKey: "03cb7628e7248ddf9c07da54b979f16bf081fb3d173aac0992ad2a44ef6a388ae2",
          },
          signature:
            "3046022100beb271fa9752c377251005e125cc115737e427d5259a2dbbc9a38f7a36430c3f0221008826b3d3c1b491b41908d7cc89d71b92e9428c52a927e95341d555252f687b0f",
        },
      ],
      protocolVersion: { major: 1, minor: 0, patch: 0 },
    });
  });

  test("toBytes", () => {
    expect(crypto.to_hex(challenge.toBytes())).toEqual(
      "010107020100121053cafde60e5395b164eb867213bc05f614010115473045022025d130d7ae5c48a6cf09781d04a08e9a2d07ce1bd17e84637f6ede4a043c5dcc022100a846ececf20eb53ffc2dc502ce8074ba40b241bfd13edaf1e8575559a9b2b4ea160465d85f2620096c6f63616c686f7374320121332102b2c29ab36022219967cc21a306599ecaf51ce9f2998da6982388d52c8c69a6a5600401000000",
    );
  });

  test("toBytes <> fromBytes", () => {
    const bytes = challenge.toBytes();
    const [challengeFromBytes, _] = Challenge.fromBytes(bytes);
    expect(challengeFromBytes).toEqual(challenge);
    expect(challengeFromBytes.toBytes()).toEqual(bytes);
  });
});
