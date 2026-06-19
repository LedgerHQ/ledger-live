export type LiveDataOpts = {
  currency?: string;
  index?: number;
  scheme?: string;
  appjson?: string;
  add?: boolean;
};

export type GetAddressOpts = {
  currency?: string;
  device?: string;
  path?: string;
  derivationMode?: string;
  verify?: boolean;
};

export type TokenApprovalOpts = {
  currency: string;
  index: number;
  spender: string;
  approveAmount?: string;
  token: string;
  waitConfirmation?: boolean;
  mode: "revokeApproval" | "approve";
};

export type GetTokenAllowanceOpts = {
  currency: string;
  spenderAddress: string;
  token: string;
  index: number | string;
  format?: "json";
  ownerAddress: string;
};
