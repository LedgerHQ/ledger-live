import { validateMemo as validateIcpMemo } from "./validation";

export function validateMemo(memo?: string): boolean {
  return validateIcpMemo(memo).isValid;
}
