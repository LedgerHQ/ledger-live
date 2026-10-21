import assert from "node:assert/strict";
import test from "node:test";
import { signS3Request } from "./sigv4";

const awsExampleCredentials = {
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
};
const awsExampleDate = new Date("2013-05-24T00:00:00Z");

const signatureOf = (authorization: string) => /Signature=([0-9a-f]+)$/.exec(authorization)?.[1];

test("matches the AWS documented GET Object example", () => {
  const headers = signS3Request({
    method: "GET",
    url: new URL("https://examplebucket.s3.amazonaws.com/test.txt"),
    headers: { Range: "bytes=0-9" },
    body: "",
    region: "us-east-1",
    credentials: awsExampleCredentials,
    now: awsExampleDate,
  });

  assert.equal(
    headers["x-amz-content-sha256"],
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
  assert.equal(headers["x-amz-date"], "20130524T000000Z");
  assert.match(
    headers.authorization,
    /^AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE\/20130524\/us-east-1\/s3\/aws4_request, SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, /,
  );
  assert.equal(
    signatureOf(headers.authorization),
    "f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41",
  );
});

test("matches the AWS documented PUT Object example, including path encoding", () => {
  const headers = signS3Request({
    method: "PUT",
    url: new URL("https://examplebucket.s3.amazonaws.com/test$file.text"),
    headers: {
      Date: "Fri, 24 May 2013 00:00:00 GMT",
      "x-amz-storage-class": "REDUCED_REDUNDANCY",
    },
    body: "Welcome to Amazon S3.",
    region: "us-east-1",
    credentials: awsExampleCredentials,
    now: awsExampleDate,
  });

  assert.equal(
    headers["x-amz-content-sha256"],
    "44ce7dd67c959e0d3524ffac1771dfbba87d2b6b4b4e99e42034a8b803f8b072",
  );
  assert.equal(
    signatureOf(headers.authorization),
    "98ad721746da40c64f1a55b78f14c238d841ea1380cd77a1b5971af0ece108bd",
  );
});

test("signs conditional-write headers so they cannot be stripped in transit", () => {
  const headers = signS3Request({
    method: "PUT",
    url: new URL("https://account.r2.cloudflarestorage.com/bucket/key.json"),
    headers: { "If-None-Match": "*", "Content-Type": "application/json" },
    body: "{}",
    region: "auto",
    credentials: awsExampleCredentials,
    now: awsExampleDate,
  });

  assert.match(
    headers.authorization,
    /SignedHeaders=content-type;host;if-none-match;x-amz-content-sha256;x-amz-date,/,
  );
  assert.match(headers.authorization, /\/20130524\/auto\/s3\/aws4_request,/);
});
