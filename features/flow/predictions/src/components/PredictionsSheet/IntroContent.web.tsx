import React from "react";
import { useTranslation } from "@shared/i18n";
import {
  Button,
  DialogBody,
  DialogHeader,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import { LedgerLogo, Planet } from "@ledgerhq/lumen-ui-react/symbols";
import heroImage from "../../assets/predictions-intro.webp";
import type { IntroContentProps } from "./IntroContent.types";
import { INTRO_TITLE_ID } from "./introTitleId";

const ITEMS = [
  { key: "polymarket", Icon: LedgerLogo },
  { key: "markets", Icon: Planet },
  { key: "clearSign", Icon: LedgerLogo },
] as const;

export function IntroContent({ onDiscover, onLearnMore }: IntroContentProps) {
  const { t } = useTranslation();

  return (
    <>
      <DialogHeader className="mb-0" density="compact" />
      <DialogBody className="flex flex-col gap-24">
        <img
          src={heroImage}
          alt=""
          className="h-[200px] w-full shrink-0 rounded-lg object-cover"
          draggable={false}
        />
        <div className="flex flex-col">
          <div className="flex flex-col gap-4 pb-12">
            <div className="flex flex-col gap-8 pb-12">
              <h2 id={INTRO_TITLE_ID} className="heading-2-semi-bold text-base">
                {t("predictions.onboarding.intro.title")}
              </h2>
              <p className="body-2 text-muted">{t("predictions.onboarding.intro.subtitle")}</p>
            </div>
            <div className="flex flex-col">
              {ITEMS.map(({ key, Icon }) => (
                <ListItem key={key}>
                  <ListItemLeading>
                    <Icon size={24} />
                    <ListItemContent>
                      <ListItemTitle>
                        {t(`predictions.onboarding.intro.items.${key}.title`)}
                      </ListItemTitle>
                      <ListItemDescription>
                        {t(`predictions.onboarding.intro.items.${key}.subtitle`)}
                      </ListItemDescription>
                    </ListItemContent>
                  </ListItemLeading>
                </ListItem>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-16">
            <Button appearance="base" size="lg" isFull onClick={onDiscover}>
              {t("predictions.onboarding.intro.discover")}
            </Button>
            <Button appearance="no-background" size="sm" onClick={onLearnMore}>
              {t("predictions.onboarding.intro.learnMore")}
            </Button>
          </div>
        </div>
      </DialogBody>
    </>
  );
}
