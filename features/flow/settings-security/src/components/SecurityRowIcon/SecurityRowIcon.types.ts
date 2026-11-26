import type { SecurityRowId } from "../../logic/securityRows";
import type { BiometricKind } from "../../types";

export type SecurityRowIconProps = Readonly<{ id: SecurityRowId; biometricKind?: BiometricKind }>;
