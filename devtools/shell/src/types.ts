export enum Category {
  DEV_TOOLS = "Dev Tools",
  DEVICE = "Device",
  NETWORK = "Network",
  CRYPTO = "Crypto",
  DEBUG = "Debug",
}

export interface Tool {
  label: string;
  category: Category;
}
