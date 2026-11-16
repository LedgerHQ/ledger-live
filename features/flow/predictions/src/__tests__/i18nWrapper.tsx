import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";
import { LinkingProvider } from "@shared/linking";

export const TERMS_OF_USE_LINK = "Terms of Use";

/** The `predictions.onboarding` translations the tests render, shaped like the app's i18n keys. */
export const PREDICTIONS_COPY = {
  intro: {
    title: "Trade on future events",
    subtitle: "Access the world's largest prediction market.",
    items: {
      polymarket: { title: "Access Polymarket", subtitle: "Now in Ledger Wallet" },
      markets: { title: "Sports, Tech, Crypto", subtitle: "And more" },
      clearSign: { title: "Clear sign all", subtitle: "You clear sign every trade" },
    },
    discover: "Discover predictions",
    learnMore: "Learn more",
  },
  terms: {
    title: "Terms & Conditions",
    body: `Prediction markets carry substantial risk. Refer to the <termsLink>${TERMS_OF_USE_LINK}</termsLink> for more information.`,
    checkbox: "I accept the risks of trading on prediction markets.",
    cta: "Agree and Continue",
  },
  consent: {
    title: "Clear signed trade on Polymarket via MoonPay",
    description: "Select a Ledger Wallet address to sign your trades.",
    bullets: {
      dedicatedWallet: "Dedicated trading wallet",
      secureSigning: "Secure signing",
      withdraw: "Withdraw anytime",
    },
    checkbox: "I agree to create a MoonPay Trade wallet address.",
    cta: "Continue",
    footer: "Crypto transaction services are provided by MoonPay.",
  },
} as const;

export const SETUP_COPY = {
  settingUp: { title: "Setting up your trading account" },
  setUp: {
    created: "Trading account created",
    found: "Trading account found",
    description: "Your trading account is ready to use.",
    continue: "Continue",
  },
  setupFailed: {
    title: "Your trading account couldn't be set up",
    "failed-deploy": "MoonPay couldn't deploy your trading wallet.",
    "failed-permission": "MoonPay couldn't set up your trading wallet's permissions.",
    timeout: "The setup is taking too long.",
    unavailable: "MoonPay couldn't be reached.",
    unknown: "Something went wrong while setting it up.",
  },
} as const;

const RESOURCES = {
  en: {
    translation: {
      common: { close: "Close" },
      predictions: { onboarding: PREDICTIONS_COPY, binding: SETUP_COPY },
    },
  },
};

export const openExternalMock = jest.fn();

export function I18nWrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nTestProvider resources={RESOURCES}>
      <LinkingProvider config={{ openExternal: openExternalMock }}>{children}</LinkingProvider>
    </I18nTestProvider>
  );
}
