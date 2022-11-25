export type ProtectStateNumber = 800 | 900 | 1000 | 1100 | 1200;

export type ProtectData = {
  services: {
    protect: {
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
