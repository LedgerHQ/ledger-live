import type { NanoDeviceModelId } from "../types";

export type LnsUpsellTracking = "opted_in" | "opted_out";

export type LnsUpsellCopySurface = "banner" | "profile";

export type LnsUpsellCopyKeys = Readonly<{
  title: string;
  description: string;
  cta: string;
}>;

const LNS_UPSELL_COPY_ROOT = "lnsUpsell";

const MODEL_SPECIFIC_COPY: ReadonlySet<string> = new Set([
  `${LNS_UPSELL_COPY_ROOT}.opted_in.nanoS`,
  `${LNS_UPSELL_COPY_ROOT}.opted_out.nanoS`,
  `${LNS_UPSELL_COPY_ROOT}.profile.nanoS`,
]);

export function getLnsUpsellCopyKeys({
  tracking,
  surface,
  deviceModelId,
}: {
  tracking: LnsUpsellTracking;
  surface: LnsUpsellCopySurface;
  deviceModelId?: NanoDeviceModelId;
}): LnsUpsellCopyKeys {
  const bodyNamespace = getCopyBaseNamespace(tracking, surface);
  const copyNamespace = getModelCopyNamespace(bodyNamespace, deviceModelId);
  const ctaNamespace = surface === "profile" ? `${LNS_UPSELL_COPY_ROOT}.profile` : bodyNamespace;

  return {
    title: `${copyNamespace}.title`,
    description: `${copyNamespace}.description`,
    cta: `${ctaNamespace}.cta`,
  };
}

function getCopyBaseNamespace(tracking: LnsUpsellTracking, surface: LnsUpsellCopySurface): string {
  if (tracking === "opted_out") {
    return `${LNS_UPSELL_COPY_ROOT}.opted_out`;
  }

  return surface === "profile"
    ? `${LNS_UPSELL_COPY_ROOT}.profile`
    : `${LNS_UPSELL_COPY_ROOT}.opted_in`;
}

function getModelCopyNamespace(baseNamespace: string, deviceModelId?: NanoDeviceModelId): string {
  if (!deviceModelId) {
    return baseNamespace;
  }

  const modelNamespace = `${baseNamespace}.${deviceModelId}`;
  return MODEL_SPECIFIC_COPY.has(modelNamespace) ? modelNamespace : baseNamespace;
}
