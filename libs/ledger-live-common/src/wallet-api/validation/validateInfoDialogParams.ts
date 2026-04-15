import { validateUrl } from "./validateUrl";

export interface InfoDialogParams {
  title: string;
  message: string;
  linkText?: string;
  linkHref?: string;
}

export interface ValidatedInfoDialogParams {
  title: string;
  message: string;
  linkText?: string;
  linkHref?: string;
}

export function validateInfoDialogParams(
  params: InfoDialogParams | undefined,
  handlerName: string,
): ValidatedInfoDialogParams {
  if (!params) {
    throw new Error(`Missing params for ${handlerName}`);
  }

  const { title, message, linkText, linkHref } = params;

  if (typeof title !== "string" || typeof message !== "string") {
    throw new TypeError(
      `Invalid params for ${handlerName}: expected non-empty string 'title' and 'message'.`,
    );
  }

  const trimmedTitle = title.trim();
  const trimmedMessage = message.trim();
  if (!trimmedTitle || !trimmedMessage) {
    throw new Error(
      `Invalid params for ${handlerName}: expected non-empty string 'title' and 'message'.`,
    );
  }

  if (linkText != null && typeof linkText !== "string") {
    throw new Error(
      `Invalid params for ${handlerName}: 'linkText' must be a string when provided.`,
    );
  }
  if (linkHref != null && typeof linkHref !== "string") {
    throw new Error(
      `Invalid params for ${handlerName}: 'linkHref' must be a string when provided.`,
    );
  }

  const trimmedLinkText = linkText ? linkText.trim() || undefined : undefined;

  let validatedLinkHref: string | undefined;
  if (linkHref) {
    validatedLinkHref = validateUrl(linkHref) || undefined;
    if (!validatedLinkHref) {
      throw new Error(
        `Invalid params for ${handlerName}: 'linkHref' is not an allowed URL.`,
      );
    }
  }

  return {
    title: trimmedTitle,
    message: trimmedMessage,
    linkText: trimmedLinkText,
    linkHref: validatedLinkHref,
  };
}
