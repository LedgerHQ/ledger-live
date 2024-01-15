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
};

const ErrorBanner = ({ error, warning, fallback }: Props) => {
  const maybeUrl = error ? urls.errors[String(error?.name)] : null;
  return (
    <Alert
      type={warning ? "warning" : "error"}
      title={<TranslatedError error={error} field="title" fallback={fallback?.title} />}
      learnMoreUrl={maybeUrl}
      mb={4}
    >
      <TranslatedError error={error} field="description" fallback={fallback?.description} />
    </Alert>
  );
};
export default ErrorBanner;
