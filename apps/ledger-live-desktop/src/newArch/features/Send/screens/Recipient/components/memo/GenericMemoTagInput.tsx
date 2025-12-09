import React, { useCallback, useState } from "react";
import {
  Banner,
  Button,
  Link,
  TextInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/ldls-ui-react";
import { Information } from "@ledgerhq/ldls-ui-react/symbols";
import { useTranslation } from "react-i18next";
import { capitalizeFirstLetter } from "../../utils/stringUtils";

type GenericMemoTagInputProps = {
  onChange: (value: string) => void;
  onSkip: () => void;
  maxMemoLength?: number;
  placeholder?: string;
  error?: Error | boolean | null | undefined;
  memoType?: "memo" | "tag";
  network?: string;
};

export function GenericMemoTagInput({
  onChange,
  onSkip,
  maxMemoLength,
  placeholder,
  error,
  network,
  memoType = "memo",
}: GenericMemoTagInputProps) {
  const { t } = useTranslation();

  const [skipState, setSkipState] = useState<"asked" | "requested" | "confirmed" | "forbidden">(
    "asked",
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleOnSkipRequested = useCallback(() => {
    setSkipState("requested");
  }, []);

  const handleOnSkipConfirmed = useCallback(() => {
    setSkipState("confirmed");
    onSkip();
  }, [onSkip]);

  const handleOnSkipForbidden = useCallback(() => {
    setSkipState("forbidden");
    onSkip();
  }, [onSkip]);

  const handleOnBannerClose = useCallback(() => {
    setSkipState("asked");
  }, []);

  return (
    <div className="flex w-full flex-col gap-16 px-24">
      <TextInput
        data-testid="memo-tag-input"
        onChange={handleChange}
        errorMessage={error instanceof Error ? t(`error.${error.name}.title`) : ""}
        placeholder={placeholder ?? t("MemoTagField.placeholder")}
        maxLength={maxMemoLength}
        suffix={
          <div className="flex h-[256px] items-center justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Information size={20} />
              </TooltipTrigger>
              <TooltipContent>{t("MemoTagField.tooltip", { memoType, network })}</TooltipContent>
            </Tooltip>
          </div>
        }
      />
      {skipState === "asked" && (
        <div className="line-clamp-1">
          <p className="text-base-default body-2 overflow-hidden text-ellipsis font-medium not-italic">
            {t("MemoTagField.askNotRequiredMemo", { memoType: capitalizeFirstLetter(memoType) })}{" "}
            <Link appearance="base" size="md" onClick={handleOnSkipRequested}>
              {t("MemoTagField.skip")}
            </Link>
          </p>
        </div>
      )}

      {skipState === "requested" && (
        <Banner
          appearance="warning"
          title={t("MemoTagField.skipWarningBanner.title", { memoType })}
          description={t("MemoTagField.skipWarningBanner.description", { memoType })}
          onClose={handleOnBannerClose}
          primaryAction={
            <Button appearance="transparent" size="sm" onClick={handleOnSkipConfirmed}>
              {t("MemoTagField.skipWarningBanner.confirm")}
            </Button>
          }
          secondaryAction={
            <Button appearance="no-background" size="sm" onClick={handleOnSkipForbidden}>
              {t("MemoTagField.skipWarningBanner.forbid")}
            </Button>
          }
        />
      )}
    </div>
  );
}
