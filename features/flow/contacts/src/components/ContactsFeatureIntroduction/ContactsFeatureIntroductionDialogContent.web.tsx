import React from "react";
import * as Icons from "@ledgerhq/lumen-ui-react/symbols";
import type {
  ContactsFeatureIntroductionHighlight,
} from "../../list/types";

const FEATURE_INTRO_HERO_IMAGE_CLASSNAME =
  "pointer-events-none h-[200px] w-full select-none rounded-xl object-cover";

type ContactsFeatureIntroductionDialogContentProps = Readonly<{
  title: string;
  description: string;
  highlights: readonly ContactsFeatureIntroductionHighlight[];
  heroImage: string;
}>;

export function ContactsFeatureIntroductionDialogContent({
  title,
  description,
  highlights,
  heroImage,
}: ContactsFeatureIntroductionDialogContentProps): React.ReactNode {
  return (
    <div className="scrollbar-none flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto">
      <div
        className="relative h-[200px] w-full shrink-0 overflow-hidden rounded-xl bg-[rgba(255,255,255,0.05)]"
        data-testid="contacts-feature-introduction-hero"
      >
        <img
          src={heroImage}
          alt=""
          className={FEATURE_INTRO_HERO_IMAGE_CLASSNAME}
          draggable={false}
          decoding="async"
        />
      </div>
      <div className="flex w-full min-w-0 flex-col gap-8">
        <h2 className="heading-2-semi-bold text-base">{title}</h2>
        <p className="body-2 text-muted">{description}</p>
      </div>
      {highlights.map(highlight => {
        const HighlightIcon = Icons[highlight.icon];

        return (
          <div key={highlight.icon} className="flex gap-16">
            <HighlightIcon size={24} className="shrink-0 text-base" />
            <div className="flex min-w-0 flex-col gap-4">
              <p className="body-1-semi-bold text-base">{highlight.title}</p>
              <p className="body-2 text-muted">{highlight.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
