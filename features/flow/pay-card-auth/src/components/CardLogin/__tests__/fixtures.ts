export const CARD_LOGIN_INTRO_RESOURCES = {
  en: {
    translation: {
      payTab: {
        cardLogin: {
          title: "Crypto Card",
          beforeIntro: {
            title: "Get your crypto card",
            description: "Get 1% cashback every time you spend",
            action: "Get card",
            alreadyHaveCard: "I already have a card",
          },
          afterIntro: {
            title: "Log in to access your Card",
            description: "You’ve been logged out for security",
            action: "Log in",
          },
          errors: {
            pkce_failed: { title: "Login could not start", description: "Please try again." },
            browser_open_failed: {
              title: "The login page could not open",
              description: "Please try again.",
            },
            missing_attempt: {
              title: "This login is no longer valid",
              description: "Please log in again.",
            },
            exchange_failed: {
              title: "Login could not be completed",
              description: "Please try again.",
            },
            persist_failed: {
              title: "Your session could not be saved",
              description: "Please try again.",
            },
            fetch_user_failed: {
              title: "Your card could not be loaded",
              description: "Please try again.",
            },
            retryLogin: "Try again",
            retryUser: "Retry",
          },
        },
        cardLoginIntro: {
          title: "Spend crypto, earn cashback",
          providedBy: "Card provided by Baanx",
          createAccount: "Create an account",
          logIn: "Log in to Baanx",
          wallets: {
            applePay: "Apple Pay",
            googlePay: "Google Pay",
            both: "Apple Pay or Google Pay",
          },
          rows: {
            cashback: {
              title: "Uncapped 1% crypto cashback",
              description: "On all crypto card purchases with USDC, USDT, or BTC.",
            },
            virtualCard: {
              title: "Free virtual card",
              description: "Add to {{wallet}}, ready instantly.",
            },
            topUp: {
              title: "Securely top up via Ledger Wallet",
              description: "Every transfer approved with your Ledger signer.",
            },
          },
        },
      },
    },
  },
};
