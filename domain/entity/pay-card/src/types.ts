import type { PayCardParams } from "./schema";

export type { PayCardParams };

export type PayCardState = Readonly<{
  isOpen: boolean;
  params: PayCardParams | null;
}>;
