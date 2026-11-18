import type { ReactNode } from "react";

export type VerifyAddressErrorProps = Readonly<{
  /** The app renders the error's own title and description, as for any device error. */
  title: ReactNode;
  description: ReactNode;
  onClose: () => void;
}>;
