import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { OsUpdatesSteps, type OsUpdatesProgress } from "@ledgerhq/live-dmk-shared";
import type { OsUpdateStepProps } from "../../components/OsUpdateStep/useOsUpdateStepViewModel";
import {
  noop,
  previewConnectedDevice,
  previewModels,
  previewReleaseNotes,
  previewTargetVersion,
  type PreviewModelId,
  type ProgressPreset,
  type UpdateCount,
} from "./fixtures";
import {
  previewGroups,
  restoringProgress,
  updatingProgress,
  type Preview,
  type PreviewOptions,
} from "./previews";

const previews = previewGroups.flatMap(group => group.previews);

/** What the orchestrator shows before the previewed state, so its progress bar is not empty. */
function getProgressBackground(
  progress: OsUpdatesProgress,
  options: PreviewOptions,
): OsUpdatesProgress | undefined {
  switch (progress.step) {
    case OsUpdatesSteps.APPLY_UPDATES:
      return updatingProgress(options);
    case OsUpdatesSteps.RESTORE_BACKUP:
      return restoringProgress(options);
    default:
      return undefined;
  }
}

export function useOsUpdateGalleryViewModel() {
  const navigation = useNavigation();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [modelId, setModelId] = useState<PreviewModelId>(previewModels[0].modelId);
  const [updateCount, setUpdateCount] = useState<UpdateCount>(1);
  const [progress, setProgress] = useState<ProgressPreset>(0.45);

  const model = previewModels.find(previewModel => previewModel.modelId === modelId)!;
  const connectedDevice = previewConnectedDevice(model.modelId, model.label);
  const options: PreviewOptions = { updateCount, progress };
  const preview = previews.find(({ id }) => id === previewId);

  const onClosePreview = () => setPreviewId(null);

  const buildStep = (stepPreview: Extract<Preview, { kind: "step" }>) => {
    const target = stepPreview.build(options);
    const isCloseConfirmationOpen = stepPreview.isCloseConfirmationOpen ?? false;
    const toProps = (osUpdatesProgress: OsUpdatesProgress) =>
      ({
        ...osUpdatesProgress,
        connectedDevice,
        onUserClose: onClosePreview,
        isCloseConfirmationOpen,
      }) as OsUpdateStepProps;
    const background = getProgressBackground(target, options);

    return {
      props: toProps(target),
      backgroundProps: background ? toProps(background) : undefined,
      isCloseConfirmationOpen,
    };
  };

  return {
    previewGroups,
    preview,
    previewKey: [previewId, modelId, updateCount, progress].join("|"),
    models: previewModels,
    modelId,
    onSelectModel: setModelId,
    updateCount,
    onSelectUpdateCount: setUpdateCount,
    progress,
    onSelectProgress: setProgress,
    onSelectPreview: (next: Preview) => setPreviewId(next.id),
    onClosePreview,
    onBack: () => navigation.goBack(),
    step: preview?.kind === "step" ? buildStep(preview) : undefined,
    whatsNewProps: {
      version: previewTargetVersion,
      notes: previewReleaseNotes,
      onOpenReleaseNotes: noop,
      onStart: onClosePreview,
      onClose: onClosePreview,
    },
  };
}

export type OsUpdateGalleryViewModel = ReturnType<typeof useOsUpdateGalleryViewModel>;
