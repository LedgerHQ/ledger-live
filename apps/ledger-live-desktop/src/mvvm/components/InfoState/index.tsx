import React from "react";
import { Banner } from "@ledgerhq/lumen-ui-react";
import { useDialogBackgroundTone } from "LLD/hooks/useDialogBackgroundTone";
import { cn } from "LLD/utils/cn";
import type { InfoStateProps } from "./types";
import { InfoStateButton } from "./components/InfoStateButton";
import { PresetVisual } from "./components/PresetVisual";
import { getInfoStateDialogTone } from "./utils/getInfoStateDialogTone";

/**
 * Shared desktop state layout for informational, success, and error screens.
 */
export function InfoState(props: InfoStateProps) {
  const {
    title,
    description,
    primaryCta,
    secondaryCta,
    banner,
    size = "full-height",
    testID,
  } = props;
  const isTextPreset = props.preset === "text";
  const isFullHeight = size === "full-height";
  useDialogBackgroundTone(getInfoStateDialogTone(props.preset));

  return (
    <div className={cn("w-full", isFullHeight && "flex flex-1")} data-testid={testID}>
      <div
        className={cn(
          "flex w-full flex-col items-center gap-32 overflow-hidden px-16 py-24",
          isFullHeight && "min-h-[480px] flex-1",
        )}
      >
        <div
          className={cn(
            "flex w-full flex-col items-center justify-center",
            isFullHeight && "flex-1",
            isTextPreset ? "gap-0" : "gap-24",
          )}
        >
          <PresetVisual {...props} />
          {title || description ? (
            <div className="flex w-full flex-col items-center gap-8 text-center">
              {title ? <h3 className="heading-4-semi-bold text-base">{title}</h3> : null}
              {description ? <p className="body-2 text-muted">{description}</p> : null}
            </div>
          ) : null}
        </div>

        {banner ? (
          <div className="w-full">
            <Banner
              appearance={banner.appearance ?? "info"}
              title={banner.title}
              description={banner.description}
            />
          </div>
        ) : null}

        {primaryCta || secondaryCta ? (
          <div className="flex w-full flex-col gap-16">
            {primaryCta ? <InfoStateButton cta={primaryCta} appearance="base" /> : null}
            {secondaryCta ? <InfoStateButton cta={secondaryCta} appearance="gray" /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
