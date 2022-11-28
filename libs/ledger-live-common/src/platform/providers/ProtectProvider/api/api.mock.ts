import { ProtectData } from "../types";

export async function refreshToken(): Promise<ProtectData> {
  const response = Promise.resolve({
    services: {
      protect: {
        available: true,
        active: false,
        payment_due: false,
        subscribed_at: 0,
        last_payment_date: 0,
      },
    },
    access_token: "fake_token",
    expires_in: 300,
    refresh_expires_in: 1800,
    refresh_token: "fake_refresh_token",
    token_type: "Bearer",
  });

  return response;
}
