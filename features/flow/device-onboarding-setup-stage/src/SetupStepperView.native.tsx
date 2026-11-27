import React from "react";
import {
  Box,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
  Spinner,
  Stepper,
} from "@ledgerhq/lumen-ui-rnative";
import { CheckmarkCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { setupStepperTestIds, stageTitleTestId } from "./internals";
import type { SetupIndicator } from "./toSetupStage";
import type { SetupStepperViewProps } from "./useSetupStepperViewModel";

function StageStatus({ status }: Readonly<{ status: SetupIndicator }>) {
  if (status === "loading") return <Spinner size={20} testID={setupStepperTestIds.stageLoading} />;
  if (status === "success") {
    return (
      <CheckmarkCircleFill size={20} color="success" testID={setupStepperTestIds.stageSuccess} />
    );
  }
  return null;
}

export function SetupStepperView({
  stageKind,
  label,
  completedSteps,
  totalSteps,
  title,
  description,
  status,
}: SetupStepperViewProps) {
  return (
    <Box
      testID={setupStepperTestIds.stepper}
      lx={{
        width: "full",
        overflow: "hidden",
        borderRadius: "lg",
        backgroundColor: "surfaceTransparent",
      }}
    >
      <CardHeader>
        <CardLeading>
          <Stepper currentStep={completedSteps} totalSteps={totalSteps} label={label} />
          <CardContent>
            <CardContentTitle testID={stageTitleTestId(stageKind)}>{title}</CardContentTitle>
            {description ? <CardContentDescription>{description}</CardContentDescription> : null}
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <StageStatus status={status} />
        </CardTrailing>
      </CardHeader>
    </Box>
  );
}
