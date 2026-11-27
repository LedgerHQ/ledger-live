import { z } from "zod";
import { DerivationPathSchema, type DerivationPath } from "./derivationPath";

/** A legacy derivation path ("44'/60'/0'/0/0", with or without "m/") read as a descriptor path. */
export const LegacyDerivationPathSchema = z
  .string()
  .transform(path => `m/${path.replace(/^m\//, "")}`)
  .pipe(DerivationPathSchema);

export const toDescriptorPath = (legacyPath: string): DerivationPath =>
  LegacyDerivationPathSchema.parse(legacyPath);

/** The legacy spelling of a descriptor path ("44'/60'/0'/0/0"), as ledgerjs signers read it. */
export const fromDescriptorPath = (path: DerivationPath): string =>
  path.slice("m/".length).replaceAll("h", "'");
