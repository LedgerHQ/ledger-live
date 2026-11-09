import { describe, expect, it } from "bun:test";
import { relayProxyFromEnv } from "./relay";

describe("relayProxyFromEnv", () => {
  it.each([
    [
      "uses HTTPS_PROXY before other proxy variables",
      {
        HTTPS_PROXY: "http://https-proxy.example.com:8080",
        https_proxy: "http://lowercase-https-proxy.example.com:8080",
        HTTP_PROXY: "http://http-proxy.example.com:8080",
        http_proxy: "http://lowercase-http-proxy.example.com:8080",
      },
      "http://https-proxy.example.com:8080",
    ],
    [
      "uses lowercase HTTPS proxy when HTTPS_PROXY is absent",
      { https_proxy: "http://lowercase-https-proxy.example.com:8080" },
      "http://lowercase-https-proxy.example.com:8080",
    ],
    [
      "uses HTTP_PROXY when HTTPS proxy variables are absent",
      { HTTP_PROXY: "http://http-proxy.example.com:8080" },
      "http://http-proxy.example.com:8080",
    ],
    [
      "uses lowercase HTTP proxy when no uppercase proxy variables are present",
      { http_proxy: "http://lowercase-http-proxy.example.com:8080" },
      "http://lowercase-http-proxy.example.com:8080",
    ],
    [
      "does not use an unsupported proxy variable",
      { ALL_PROXY: "socks5://proxy.example.com" },
      undefined,
    ],
  ])("%s", (_name, environment, expected) => {
    expect(relayProxyFromEnv(environment)).toBe(expected);
  });
});
