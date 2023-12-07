// Convention:
// - errors we throw on our app will use a different error.name per error type
// - an error can have parameters, to use them, just use field of the Error object, that's what we give to `t()`
// - returned value is intentially not styled (is universal). wrap this in whatever you need

import React, { useEffect, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
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

export function TranslatedError({ error, fallback, field = "title", noLink }: Props): JSX.Element {
  const { t } = useTranslation();

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

  if (!error || !isValidError) return <></>;

  if (!translation) {
    if (fallback) return <>{fallback}</>;
    const errorKey = `errors.generic.${field}`;
    const errorTranslation = t(errorKey, args);
    return errorKey === errorTranslation ? <></> : <>{errorTranslation}</>;
  }

  if (typeof translation !== "string") {
    return <ErrorList translation={translation} />;
  }

  // This is from the previous implementation of this function and has been kept
  // for compatibility reasons with previously defined errors.
  // This section modifies the error message by appending a 'Learn More' link.
  // The link appears only when two conditions are satisfied:
  // 1) A URL corresponding to the error name exists in 'urls.errors' map.
  // 2) The 'noLink' prop is falsy, indicating that the link should be displayed.
  if (urls.errors[error.name] && !noLink) {
    return (
      <Text>
        {translation}{" "}
        <Text ff="Inter|SemiBold">
          <ExternalLink
            label={t("common.learnMore")}
            onClick={() => openURL(urls.errors[error.name])}
          />
        </Text>
      </Text>
    );
  }
  return <Trans i18nKey={translationKey} components={{ ...links }} values={args} />;
}
