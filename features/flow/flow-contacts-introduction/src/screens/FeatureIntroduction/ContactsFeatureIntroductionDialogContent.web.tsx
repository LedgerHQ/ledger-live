import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import * as Icons from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactsFeatureIntroductionHighlight } from "../../state/types";

const FEATURE_INTRO_HERO_IMAGE_CLASSNAME =
  "pointer-events-none h-[192px] w-full select-none rounded-xl object-cover";

type ContactsFeatureIntroductionDialogContentProps = Readonly<{
  title: string;
  highlights: readonly ContactsFeatureIntroductionHighlight[];
  heroImage: string;
}>;

export function ContactsFeatureIntroductionDialogContent({
  title,
  highlights,
  heroImage,
}: ContactsFeatureIntroductionDialogContentProps): React.ReactNode {
  return (
    <div className="scrollbar-none flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <div className="flex w-full shrink-0 flex-col gap-16">
        <div
          className="relative h-[192px] w-full shrink-0 overflow-hidden rounded-xl bg-muted"
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
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full flex-col gap-8 pb-8">
            <h2 className="heading-3-semi-bold text-base">{title}</h2>
          </div>
          <div className="flex w-full flex-col">
            {highlights.map(highlight => {
              const HighlightIcon = Icons[highlight.icon];

              return (
                <ListItem key={highlight.icon} density="expanded" className="-mx-8">
                  <ListItemLeading>
                    <HighlightIcon size={24} />
                    <ListItemContent>
                      <ListItemTitle>{highlight.title}</ListItemTitle>
                      <ListItemDescription>{highlight.description}</ListItemDescription>
                    </ListItemContent>
                  </ListItemLeading>
                </ListItem>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
