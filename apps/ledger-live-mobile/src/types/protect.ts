/* eslint-disable camelcase */

// * NOTE : camelcase is disabled here because those data comes from an API,
// * so there is nothing do to about the format we get from it.

export type RawProtectData = {
  services: {
    Protect: {
      available: boolean;
      active: boolean;
      payment_due: boolean;
      subscribed_at: number;
      last_payment_date: number;
    };
  };
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
};
