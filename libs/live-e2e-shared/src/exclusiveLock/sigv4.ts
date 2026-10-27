import { createHash, createHmac } from "node:crypto";
import { byCodeUnit } from "./byCodeUnit";

export type S3Credentials = {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
};

export type S3SigningInput = {
  readonly method: string;
  readonly url: URL;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
  readonly region: string;
  readonly credentials: S3Credentials;
  readonly now: Date;
};

const sha256Hex = (data: string) => createHash("sha256").update(data, "utf8").digest("hex");

const hmac = (key: string | Buffer, data: string) =>
  createHmac("sha256", key).update(data, "utf8").digest();

const encodeRfc3986 = (value: string) =>
  encodeURIComponent(value).replace(
    /[!'()*]/g,
    char => `%${Buffer.from(char).toString("hex").toUpperCase()}`,
  );

const canonicalPath = (url: URL) =>
  url.pathname
    .split("/")
    .map(segment => encodeRfc3986(decodeURIComponent(segment)))
    .join("/");

const canonicalQuery = (url: URL) =>
  [...url.searchParams.entries()]
    .map(([name, value]) => [encodeRfc3986(name), encodeRfc3986(value)] as const)
    .sort(
      ([nameA, valueA], [nameB, valueB]) => byCodeUnit(nameA, nameB) || byCodeUnit(valueA, valueB),
    )
    .map(([name, value]) => `${name}=${value}`)
    .join("&");

/**
 * AWS Signature Version 4 for a single-chunk S3 request.
 * Returns the headers to add; `host` is signed but left for the HTTP client to send.
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html
 */
export function signS3Request(input: S3SigningInput): Record<string, string> {
  const amzDate = input.now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(input.body);

  const signedHeaderValues: Record<string, string> = {
    host: input.url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  for (const [name, value] of Object.entries(input.headers)) {
    signedHeaderValues[name.toLowerCase()] = value.trim().replace(/\s+/g, " ");
  }
  const signedHeaderNames = Object.keys(signedHeaderValues).sort(byCodeUnit);
  const signedHeaders = signedHeaderNames.join(";");

  const canonicalRequest = [
    input.method,
    canonicalPath(input.url),
    canonicalQuery(input.url),
    signedHeaderNames.map(name => `${name}:${signedHeaderValues[name]}\n`).join(""),
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${input.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");
  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${input.credentials.secretAccessKey}`, dateStamp), input.region), "s3"),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

  return {
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    authorization: `AWS4-HMAC-SHA256 Credential=${input.credentials.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}
