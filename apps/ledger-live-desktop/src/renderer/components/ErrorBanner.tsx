import React from "react";
import { urls } from "~/config/urls";
import TranslatedError from "./TranslatedError";
import Alert from "./Alert";

type Props = {
  error: Error;
  warning?: boolean;
  fallback?: {
    title?: React.ReactNode;
    description?: React.ReactNode;
  };
  dataTestId?: string;
};

const ErrorBanner = ({ error, warning, fallback, dataTestId }: Props) => {
  const maybeUrl = error ? urls.errors[String(error?.name)] : null;
  const secondLink = !!maybeUrl;

  return (
    <Alert
      data-testid={dataTestId}
      type={warning ? "warning" : "error"}
      title={<TranslatedError error={error} field="title" fallback={fallback?.title} noLink />}
      learnMoreUrl={maybeUrl}
      mb={4}
    >
      <TranslatedError
        error={error}
        field="description"
        fallback={fallback?.description}
        noLink={secondLink}
      />
    </Alert>
  );
};
export default ErrorBanner;
