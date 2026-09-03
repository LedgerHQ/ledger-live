/** The `payTab.cardLogin*` copy each app ships, mirrored here for the container tests. */
export const CARD_LOGIN_INTRO_RESOURCES = {
  en: {
    translation: {
      payTab: {
        cardLogin: {
          title: "Crypto Card",
          beforeIntro: {
            description: "Get 1% cashback everytime you spend",
            action: "Get card",
          },
          afterIntro: {
            description: "Log in to access your card",
            action: "Login",
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
