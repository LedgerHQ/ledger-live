import { randomBytes } from "node:crypto";

export function generateToken(): string {
  return randomBytes(16).toString("hex");
}

export function isLoopback(address: string | undefined): boolean {
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

export function validateToken(reqUrl: string | undefined, token: string): boolean {
  const url = new URL(reqUrl ?? "", "ws://localhost");
  return url.searchParams.get("token") === token;
}
