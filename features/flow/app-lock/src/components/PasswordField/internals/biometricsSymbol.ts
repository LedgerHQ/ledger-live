import type { BiometricsKind } from "@features/platform-app-lock";
import { CursorTouch, FaceId, Fingerprint } from "@ledgerhq/lumen-ui-rnative/symbols";

type BiometricsSymbol = typeof FaceId;

const SYMBOL_BY_KIND: Readonly<Record<BiometricsKind, BiometricsSymbol>> = {
  TouchID: Fingerprint,
  Fingerprint: Fingerprint,
  FaceID: FaceId,
  OpticID: FaceId,
  Face: FaceId,
  Iris: FaceId,
};

export function biometricsSymbol(kind: BiometricsKind | undefined): BiometricsSymbol {
  return (kind && SYMBOL_BY_KIND[kind]) ?? CursorTouch;
}
