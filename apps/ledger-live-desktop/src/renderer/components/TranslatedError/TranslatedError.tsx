// Convention:
// - errors we throw on our app will use a different error.name per error type
// - an error can have parameters, to use them, just use field of the Error object, that's what we give to `t()`
// - returned value is intentially not styled (is universal). wrap this in whatever you need

import React, { useEffect, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import logger from "~/renderer/logger";
import Text from "../Text";
import ExternalLink from "../ExternalLink";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { useErrorLinks } from "./hooks/useErrorLinks";

type Props = {
  error: Error | undefined | null;
  field?: "title" | "description" | "list";
  noLink?: boolean;
  fallback?: React.ReactNode;
  dataTestId?: string;
};

type ErrorListProps = {
  translation: Object;
};

function ErrorList({ translation }: ErrorListProps) {
  return (
    <>
      {Object.entries(translation).map(([key, str]) =>
        typeof str === "string" ? <li key={key}>{str}</li> : null,
      )}
    </>
  );
}

export function TranslatedError({
  error,
  fallback,
  field = "title",
  noLink,
  dataTestId,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const ldmkTransportFlag = useFeature("ldmkTransport");

  const errorName = error?.name;

  const translationKey = useMemo(() => `errors.${errorName}.${field}`, [errorName, field]);

  const isValidError = useMemo(() => error instanceof Error, [error]);
  const links = useErrorLinks(error);

  const args = useMemo(() => {
    if (isValidError) {
      return {
        ...error,
        message: error?.message,
        returnObjects: true,
      };
    }
    return {};
  }, [error, isValidError]);

  const translation = useMemo(() => {
    const translation = t(translationKey, { ...args });
    return translation === translationKey ? undefined : translation;
  }, [args, t, translationKey]);

  useEffect(() => {
    if (!isValidError) {
      logger.critical(`TranslatedError invalid usage: ${String(error)}`);
    }
  }, [isValidError, error]);

  if (!error || !isValidError) {
    // NOTE: Temporary handling of DMK errors
    if (ldmkTransportFlag?.enabled && error && "_tag" in error) {
      if (field === "description") {
        const errorMessage =
          ("originalError" in error && (error.originalError as Error)?.message) ?? error._tag;

        return <Text>{errorMessage}</Text>;
      }
      return <Text>{error._tag as string}</Text>;
    }

    return <></>;
  }

  if (!translation) {
    if (fallback) return <>{fallback}</>;
    const errorKey = `errors.generic.${field}`;
    const errorTranslation = t(errorKey, args);
    return errorKey === errorTranslation ? <></> : <>{errorTranslation}</>;
  }

  if (typeof translation !== "string") {
    return <ErrorList translation={translation} />;
  }

  return (
    <>
      <span data-testid={dataTestId}>
        <Trans i18nKey={translationKey} components={{ ...links }} values={args} />
      </span>

      {urls.errors[error.name] && !noLink && (
        <>
          {" "}
          <Text ff="Inter|SemiBold">
            <ExternalLink
              label={t("common.learnMore")}
              onClick={() => openURL(urls.errors[error.name])}
            />
          </Text>
        </>
      )}
    </>
  );
}
