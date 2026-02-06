import React, { useCallback, useState } from "react";
import { Banner, Button, Checkbox, Link } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import type { SkipMemoState } from "../../hooks/useRecipientMemo";

type SkipMemoSectionProps = Readonly<{
  currencyId: string;
  state: SkipMemoState;
  onRequestConfirm: () => void;
  onCancelConfirm: () => void;
  onConfirm: (doNotAskAgain: boolean) => void;
}>;

function SkipMemoSectionComponent({
  currencyId,
  state,
  onRequestConfirm,
  onCancelConfirm,
  onConfirm,
}: SkipMemoSectionProps) {
  const { t } = useTranslation();
  const memoLabel = t([`families.${currencyId}.memo`, "common.memo"]);
  const [doNotAskAgain, setDoNotAskAgain] = useState(false);

  const learnMoreUrl = useLocalizedUrl(urls.memoTag.learnMore);
  const handleLearnMore = useCallback(() => {
    if (learnMoreUrl) {
      openURL(learnMoreUrl);
    }
  }, [learnMoreUrl]);

  const toggleDoNotAskAgain = useCallback(() => {
    setDoNotAskAgain(prev => !prev);
  }, []);

  const handleOnSkipConfirmed = useCallback(() => {
    onConfirm(doNotAskAgain);
  }, [onConfirm, doNotAskAgain]);

  if (state === "propose") {
    return (
      <div className="mt-16" data-testid="send-skip-memo-proposal">
        <span className="body-2 text-base">
          {t("newSendFlow.skipMemo.notRequired", { memoLabel })}
          &nbsp;
        </span>
        <Link
          data-testid="send-skip-memo-link"
          className="body-2"
          underline
          appearance="accent"
          size="sm"
          onClick={onRequestConfirm}
        >
          {t("common.skip")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-16">
      <Banner
        className="mt-16"
        appearance="warning"
        title={t("newSendFlow.skipMemo.title", { memoLabel })}
        description={t("newSendFlow.skipMemo.description", { memoLabel })}
        onClose={onCancelConfirm}
        closeAriaLabel="Close banner"
        primaryAction={
          <Button
            data-testid="send-skip-memo-confirm-button"
            appearance="transparent"
            size="sm"
            onClick={handleOnSkipConfirmed}
          >
            {t("newSendFlow.skipMemo.confirm")}
          </Button>
        }
        secondaryAction={
          <Button appearance="no-background" size="sm" onClick={handleLearnMore}>
            {t("common.learnMore")}
          </Button>
        }
      />
      <button
        data-testid="send-skip-memo-never-ask-again-button"
        type="button"
        className="mt-16 flex items-center gap-8"
        onClick={toggleDoNotAskAgain}
      >
        <div className="flex items-center" onClick={e => e.stopPropagation()}>
          <Checkbox checked={doNotAskAgain} onCheckedChange={setDoNotAskAgain} />
        </div>
        <span className="body-2 text-base">{t("newSendFlow.skipMemo.neverAskAgain")}</span>
      </button>
    </div>
  );
}

export const SkipMemoSection = React.memo(SkipMemoSectionComponent);
