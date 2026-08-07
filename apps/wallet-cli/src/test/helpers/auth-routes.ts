import { Challenge, crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import type { Route } from "./mock-server";

const CHALLENGE_TLV =
  "010107020100121053801a35c2e24b627d6e4925ce318980140101154630440220319b42a416512437e48d9c9bf204daea7da03d452c50a8caa4c2d152407ffd0c02201f121b0e99df1d30f4757b6a00b8d974d70996771893ac49c4a245c147cc1d8f160466a90248202b7472757374636861696e2d6261636b656e642e6170692e6177732e7374672e6c64672d746563682e636f6d320121332103cb7628e7248ddf9c07da54b979f16bf081fb3d173aac0992ad2a44ef6a388ae2600401000000";
const [CHALLENGE] = Challenge.fromBytes(crypto.from_hex(CHALLENGE_TLV));
const LKRP_TOKEN = makeJwt({ sub: "lkrp", exp: 4102444800 });
export const KEYCLOAK_TOKEN = makeJwt({ sub: "wallet-cli", exp: 4102444800 });

export function makeAuthRoutes(): Route[] {
  return [
    {
      method: "GET",
      match: /\/protocol\/openid-connect\/auth(\?|$)/,
      response: { tlv: CHALLENGE_TLV, json: CHALLENGE.toJSON() },
    },
    {
      method: "POST",
      match: "/openid/v1/authenticate",
      response: "wallet-cli-auth-code",
    },
    {
      method: "POST",
      match: "/openid/v1/token",
      response: { access_token: LKRP_TOKEN, token_type: "Bearer" },
    },
    {
      method: "POST",
      match: "/openid/v1/exchange",
      response: { access_token: KEYCLOAK_TOKEN, token_type: "Bearer" },
    },
  ];
}

function makeJwt(payload: Record<string, unknown>): string {
  const prefix = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${prefix}.${body}.signature`;
}
