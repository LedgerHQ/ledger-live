import { ProtectData } from "../types";

// * NOTE : `no-unused-vars` rule is disabled on purpose.
// * I wanted to have the same params as in the real methods, even though they are not used here.

const serviceActiveMockData = {
  services: {
    Protect: {
      available: true,
      active: true,
      payment_due: false,
      subscribed_at: Date.now(),
      last_payment_date: Date.now(),
    },
  },
  access_token: "fake_token",
  expires_in: 300,
  refresh_expires_in: 1800,
  refresh_token: "fake_refresh_token",
  token_type: "Bearer",
};

export async function login(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  email: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  password: string
): Promise<ProtectData> {
  const response = Promise.resolve(serviceActiveMockData);

  return response;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function refreshToken(token: string): Promise<ProtectData> {
  const response = Promise.resolve(serviceActiveMockData);

  return response;
}
