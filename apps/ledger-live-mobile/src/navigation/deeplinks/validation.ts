/**
 * Deeplink Security Validation Module
 *
 * This module provides secure validation for deeplink parameters to prevent
 * injection attacks, phishing attempts, and other security vulnerabilities.
 */

import { DdRum, ErrorSource } from "@datadog/mobile-react-native";
import { isDatadogEnabled } from "../../datadog";
import type { OptionMetadata } from "../../reducers/types";

// Maximum allowed lengths for string parameters
const MAX_MESSAGE_LENGTH = 700;
const MAX_TITLE_LENGTH = 100;
const MAX_LABEL_LENGTH = 50;

// Allowed domains for external links
const ALLOWED_DOMAINS = [
  // Ledger official domains (includes all subdomains like www.ledger.com, support.ledger.com, help.ledger.com)
  "ledger.com",
];

// Allowed protocols for external links
// Note: OptionMetadata.link only receives ledgerlive:// URLs from earn app
//       learnMoreLink only receives https://www.ledger.com URLs from earn app
const ALLOWED_PROTOCOLS = ["https:", "ledgerwallet:", "ledgerlive:"];

// Valid action types for earn deeplinks
export enum EarnDeeplinkAction {
  INFO_MODAL = "info-modal",
  MENU_MODAL = "menu-modal",
  PROTOCOL_INFO_MODAL = "protocol-info-modal",
  GET_FUNDS = "get-funds",
  GO_BACK = "go-back",
  STAKE = "stake",
  STAKE_ACCOUNT = "stake-account",
}

export interface ValidatedEarnInfoModal {
  message: string;
  messageTitle: string;
  learnMoreLink: string;
}

export interface ValidatedEarnDepositScreen {
  cryptoAssetId?: string;
  accountId?: string;
}

export interface ValidatedEarnMenuModal {
  title: string;
  options: Array<{
    label: string;
    metadata: OptionMetadata;
  }>;
}

/**
 * Sanitizes a string by removing potentially dangerous characters
 */
function sanitizeString(input: string, maxLength: number): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove HTML tags, scripts, and other potentially dangerous content
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/data:/gi, "") // Remove data: protocol
    .replace(/vbscript:/gi, "") // Remove vbscript: protocol
    .trim();

  return sanitized.slice(0, maxLength);
}

/**
 * Validates and sanitizes a URL to ensure it points to a trusted domain
 */
function validateUrl(urlString: string): string {
  if (!urlString || typeof urlString !== "string") {
    return "";
  }

  try {
    const url = new URL(urlString);

    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      logSecurityEvent("malicious_url", {
        reason: "invalid_protocol",
        protocol: url.protocol,
        url: urlString,
      });
      return "";
    }

    // Handle internal ledgerlive:// scheme - allow all ledgerlive URLs
    if (url.protocol === "ledgerlive:" || url.protocol === "ledgerwallet:") {
      return urlString;
    }

    // Check domain for external HTTPS URLs
    const hostname = url.hostname.toLowerCase();
    const isAllowedDomain = ALLOWED_DOMAINS.some(
      domain => hostname === domain || hostname.endsWith("." + domain),
    );

    if (!isAllowedDomain) {
      logSecurityEvent("malicious_url", {
        reason: "untrusted_domain",
        hostname: hostname,
        url: urlString,
      });
      return "";
    }

    return urlString;
  } catch (error) {
    logSecurityEvent("malicious_url", {
      reason: "invalid_url_format",
      url: urlString,
      error: String(error),
    });
    return "";
  }
}

/**
 * Safely parses JSON with validation
 */
function safeJsonParse<T>(jsonString: string, validator: (obj: unknown) => obj is T): T | null {
  if (!jsonString || typeof jsonString !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonString);

    if (validator(parsed)) {
      return parsed;
    }

    logSecurityEvent("invalid_json", {
      reason: "validation_failed",
      json: jsonString.length > 200 ? jsonString.substring(0, 200) + "..." : jsonString,
    });
    return null;
  } catch (error) {
    logSecurityEvent("invalid_json", {
      reason: "parse_error",
      json: jsonString.length > 200 ? jsonString.substring(0, 200) + "..." : jsonString,
      error: String(error),
    });
    return null;
  }
}

/**
 * Helper function to safely get a property from an object without type assertions
 */
function getProperty(obj: unknown, key: string): unknown {
  if (typeof obj !== "object" || obj === null) {
    return undefined;
  }

  // Use Reflect.get to avoid type assertions
  return Reflect.get(obj, key);
}

/**
 * Type guard to check if an object has the expected option structure
 */
function isValidOption(item: unknown): item is { label: string; metadata: OptionMetadata } {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const labelValue = getProperty(item, "label");
  const metadataValue = getProperty(item, "metadata");

  // Validate label
  if (typeof labelValue !== "string" || labelValue.length > MAX_LABEL_LENGTH) {
    return false;
  }

  // Validate metadata structure
  if (typeof metadataValue !== "object" || metadataValue === null) {
    return false;
  }

  return isValidMetadata(metadataValue);
}

/**
 * Type guard to check if an object is valid OptionMetadata
 */
function isValidMetadata(obj: unknown): obj is OptionMetadata {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const button = getProperty(obj, "button");
  const liveApp = getProperty(obj, "live_app");
  const flow = getProperty(obj, "flow");
  const link = getProperty(obj, "link");

  // Check required fields
  if (typeof button !== "string" || typeof liveApp !== "string" || typeof flow !== "string") {
    return false;
  }

  // Check optional link field with URL validation
  if (link !== undefined) {
    if (link !== null && typeof link !== "string") {
      return false;
    }

    // Apply URL validation if link is provided and not null
    if (typeof link === "string") {
      const validatedLink = validateUrl(link);
      if (!validatedLink) {
        logSecurityEvent("validation_failed", {
          reason: "invalid_metadata_link",
          link: link,
        });
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates if an object is a valid options array for menu modal
 */
function isValidOptionsArray(
  obj: unknown,
): obj is Array<{ label: string; metadata: OptionMetadata }> {
  if (!Array.isArray(obj)) {
    return false;
  }

  // Limit array size to prevent DoS
  if (obj.length > 10) {
    return false;
  }

  return obj.every(isValidOption);
}

/**
 * Validates earn info modal parameters
 */
export function validateEarnInfoModal(
  message: string | null,
  messageTitle: string | null,
  learnMoreLink: string | null,
): ValidatedEarnInfoModal | null {
  const sanitizedMessage = sanitizeString(message || "", MAX_MESSAGE_LENGTH);
  const sanitizedTitle = sanitizeString(messageTitle || "", MAX_TITLE_LENGTH);
  const validatedUrl = validateUrl(learnMoreLink || "");

  // Reject if all fields are empty or if URL validation failed and was provided
  if (!sanitizedMessage && !sanitizedTitle && !validatedUrl) {
    return null;
  }

  // If learnMoreLink was provided but validation failed, reject the entire request
  if (learnMoreLink && !validatedUrl) {
    return null;
  }

  return {
    message: sanitizedMessage,
    messageTitle: sanitizedTitle,
    learnMoreLink: validatedUrl,
  };
}

export function validateEarnDepositScreen(
  cryptoAssetId?: string,
  accountId?: string,
): ValidatedEarnDepositScreen {
  return {
    cryptoAssetId: sanitizeString(cryptoAssetId || "", MAX_TITLE_LENGTH),
    accountId: sanitizeString(accountId || "", MAX_TITLE_LENGTH),
  };
}

/**
 * Validates earn menu modal parameters
 */
export function validateEarnMenuModal(
  title: string | null,
  options: string | null,
): ValidatedEarnMenuModal | null {
  const sanitizedTitle = sanitizeString(title || "", MAX_TITLE_LENGTH);

  if (!options) {
    return null;
  }

  const parsedOptions = safeJsonParse(options, isValidOptionsArray);

  if (!parsedOptions) {
    return null;
  }

  // Sanitize option labels
  const sanitizedOptions = parsedOptions.map(option => ({
    label: sanitizeString(option.label, MAX_LABEL_LENGTH),
    metadata: option.metadata,
  }));

  return {
    title: sanitizedTitle,
    options: sanitizedOptions,
  };
}

/**
 * Type guard to check if a string is a valid EarnDeeplinkAction
 */
function isValidEarnAction(action: string): action is EarnDeeplinkAction {
  const validActions: string[] = [
    EarnDeeplinkAction.INFO_MODAL,
    EarnDeeplinkAction.MENU_MODAL,
    EarnDeeplinkAction.PROTOCOL_INFO_MODAL,
    EarnDeeplinkAction.GET_FUNDS,
    EarnDeeplinkAction.GO_BACK,
    EarnDeeplinkAction.STAKE,
    EarnDeeplinkAction.STAKE_ACCOUNT,
  ];
  return validActions.includes(action);
}

/**
 * Validates earn deeplink action type
 */
export function validateEarnAction(action: string | null): EarnDeeplinkAction | null {
  if (!action || typeof action !== "string") {
    return null;
  }

  const normalizedAction = action.toLowerCase().trim();

  if (isValidEarnAction(normalizedAction)) {
    return normalizedAction;
  }

  return null;
}

/**
 * Logs security events for monitoring
 */
export function logSecurityEvent(
  eventType: "validation_failed" | "malicious_url" | "invalid_json" | "blocked_action",
  details: Record<string, unknown>,
): void {
  const eventData = {
    event_type: eventType,
    timestamp: new Date().toISOString(),
    ...details,
  };

  // Track security events in Datadog if enabled
  if (isDatadogEnabled) {
    DdRum.addError(
      `Deeplink security event: ${eventType}`,
      ErrorSource.SOURCE,
      "", // No stacktrace for security events
      {
        deeplink_security: eventData,
        security_event: eventType,
      },
    );
  }
}
