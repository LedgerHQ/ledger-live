import React from "react";
import { useTheme } from "styled-components";
import Text from "../asorted/Text";
import Table, { Column } from "./index";
import { CellProps } from "./Columns";
const { Columns } = Table;

function Header({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Text
      fontWeight="semiBold"
      variant={"paragraph"}
      style={{ borderBottom: `1px solid ${theme.colors.neutral.c40}` }}
      mx={-4}
      px={4}
      pb={8}
    >
      {children}
    </Text>
  );
}

export type BalanceElement = {
  currency: string;
  amount: number;
  counterValue: number;
  address: string;
  evolution: number;
  starred: boolean;
};

export const balance: { data: BalanceElement[]; columns: Column<BalanceElement>[] } = {
  data: [
    {
      currency: "Ethereum Classic",
      amount: 128.26484,
      counterValue: 53.29,
      address: "0x32Be343B94f860124dC4fEe278FDCBD38C102D88",
      evolution: 0.1,
      starred: false,
    },
    {
      currency: "Ethereum",
      amount: 1.23,
      counterValue: 3029.29,
      address: "0xa910f92acdaf488fa6ef02174fb86208ad7722ba",
      evolution: 3.0,
      starred: true,
    },
    {
      currency: "Bitcoin",
      amount: 0.003,
      counterValue: 1920.23,
      address: "1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX",
      evolution: -2.1,
      starred: true,
    },
    {
      currency: "Dai",
      amount: 128,
      counterValue: 128,
      address: "0x380389E04f7671AB849baF10bd89C75C3bf99cbB",
      evolution: 0.2,
      starred: false,
    },
  ],
  columns: [
    Columns.text({
      header: () => <Header>Currency</Header>,
      title: (elt) => elt.currency,
    }),
    Columns.text({
      header: () => <Header>Amount</Header>,
      title: (elt) => elt.amount,
      subtitle: (elt) => elt.counterValue,
    }),
    Columns.text({
      header: () => <Header>Address</Header>,
      subtitle: (elt) => elt.address,
    }),
    Columns.text({
      header: () => <Header>Evolution</Header>,
      subtitle: (elt) => (elt.evolution > 0 ? "+" : "") + elt.evolution,
      subtitleProps: (elt) => ({
        color: elt.evolution < 0 ? "error.c100" : "success.c100",
      }),
    }),
    Columns.icon({
      header: () => <Header>&nbsp;</Header>,
      props: (elt) => ({
        name: "StarSolid",
        color: elt.starred ? "neutral.c100" : "neutral.c70",
      }),
    }),
  ],
};

export type Account = {
  name: string;
  currency: { name: string; abbrev: string };
  synchronized: boolean;
  amount: number;
  evolution: number;
  starred: boolean;
  subAccounts?: Account[];
};

export const accounts: { data: Account[]; columns: Column<Account>[] } = {
  data: [
    {
      name: "Bitcoin 1",
      currency: { name: "Bitcoin", abbrev: "BTC" },
      synchronized: false,
      amount: 0.304,
      evolution: 1.3,
      starred: false,
    },
    {
      name: "Bitcoin 2",
      currency: { name: "Bitcoin", abbrev: "BTC" },
      synchronized: true,
      amount: 0.409,
      evolution: 1.1,
      starred: false,
    },
    {
      name: "Bitcoin 3",
      currency: { name: "Bitcoin", abbrev: "BTC" },
      synchronized: true,
      amount: 2.304,
      evolution: -1.3,
      starred: true,
    },
    {
      name: "Ethereum 1",
      currency: { name: "Ethereum", abbrev: "ETH" },
      synchronized: true,
      amount: 1.23,
      evolution: 4,
      starred: true,
      subAccounts: [
        {
          name: "Tether",
          currency: { name: "Tether", abbrev: "USDT" },
          synchronized: false,
          amount: 0.304,
          evolution: 1.3,
          starred: false,
        },
        {
          name: "Tether 2",
          currency: { name: "Tether", abbrev: "USDT" },
          synchronized: false,
          amount: 0.904,
          evolution: 8.3,
          starred: true,
        },
      ],
    },
    {
      name: "Ethereum 2",
      currency: { name: "Ethereum", abbrev: "ETH" },
      synchronized: false,
      amount: 0.23,
      evolution: -3,
      starred: false,
    },
  ],
  columns: [
    {
      layout: "64px",
      render: ({ elt }: CellProps<Account>): JSX.Element =>
        elt.currency.abbrev === "BTC" ? svgBtc : elt.currency.abbrev === "ETH" ? svgEth : svgUsdt,
    },
    Columns.text({
      layout: "2fr",
      title: (elt) => elt.name,
      subtitle: (elt) => elt.currency.name,
    }),
    Columns.icon({
      props: (elt) => ({
        name: elt.synchronized ? "CircledCheck" : "Clock",
        color: elt.synchronized ? "success.c100" : "neutral.c80",
      }),
    }),
    Columns.text({
      layout: "1fr",
      subtitle: (elt) => elt.currency.abbrev,
    }),
    Columns.text({
      layout: "1fr",
      title: (elt) => elt.amount,
    }),
    Columns.text({
      layout: "1fr",
      subtitle: (elt) => (elt.evolution > 0 ? "+" : "") + elt.evolution,
      subtitleProps: (elt) => ({
        color: elt.evolution < 0 ? "error.c100" : "success.c100",
      }),
    }),
    Columns.icon({
      props: (elt) => ({
        name: "StarSolid",
        color: elt.starred ? "neutral.c100" : "neutral.c70",
      }),
    }),
  ],
};

const svgBtc = (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0 16C0 7.16344 7.16344 0 16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16Z"
      fill="#F7931A"
    />
    <path
      d="M21.8917 14.3672C22.154 12.616 20.8198 11.6745 18.9968 11.0462L19.5883 8.67348L18.1446 8.31423L17.5682 10.6243C17.1889 10.529 16.7995 10.4405 16.4111 10.3519L16.9917 8.02683L15.548 7.66675L14.9565 10.0386C14.6424 9.96678 14.3333 9.8966 14.0342 9.82141L14.0358 9.81389L12.0441 9.31679L11.6598 10.8591C11.6598 10.8591 12.7317 11.1047 12.7091 11.1197C13.2939 11.2659 13.3992 11.6527 13.3817 11.9602L12.7083 14.6629C12.7484 14.6729 12.8002 14.688 12.8587 14.7105L12.7058 14.6729L11.7617 18.4593C11.6899 18.6364 11.5086 18.9029 11.0992 18.8018C11.1142 18.8227 10.0498 18.5403 10.0498 18.5403L9.33301 20.1929L11.2128 20.6616C11.562 20.7493 11.9046 20.8412 12.2413 20.9272L11.6439 23.3267L13.0867 23.6859L13.6783 21.3132C14.0726 21.4193 14.4552 21.5179 14.8295 21.6115L14.2397 23.9742L15.6834 24.3334L16.2807 21.939C18.7437 22.4052 20.5951 22.2172 21.3745 19.9898C22.0028 18.1969 21.3436 17.1618 20.0478 16.4876C20.9919 16.2704 21.7021 15.6496 21.8917 14.3672ZM18.5916 18.994C18.1463 20.7877 15.1261 19.8177 14.147 19.5746L14.9406 16.3957C15.9198 16.6405 19.0586 17.1242 18.5916 18.994ZM19.0386 14.3413C18.6317 15.9729 16.1186 15.1433 15.3041 14.9403L16.0226 12.0579C16.8371 12.261 19.463 12.6394 19.0386 14.3413Z"
      fill="white"
    />
  </svg>
);

const svgEth = (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0 16C0 7.16344 7.16344 0 16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16Z"
      fill="#0EBDCD"
    />
    <path
      d="M21.2066 15.5834L15.9992 7.66669L10.7916 15.5834L15.9992 18.6067L21.2066 15.5834Z"
      fill="white"
    />
    <path
      d="M15.9992 24.3333L21.21 17.1241L15.9992 20.147L10.7916 17.1241L15.9992 24.3333Z"
      fill="white"
    />
  </svg>
);

const svgUsdt = (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0 16C0 7.16344 7.16344 0 16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16Z"
      fill="#00A478"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.7205 16.6265V16.6246C17.6175 16.6321 17.0863 16.6639 15.9013 16.6639C14.9551 16.6639 14.289 16.6358 14.0548 16.6246V16.6274C10.4125 16.4672 7.69393 15.833 7.69393 15.0742C7.69393 14.3163 10.4125 13.6821 14.0548 13.5191V15.996C14.2928 16.0128 14.9748 16.0531 15.9172 16.0531C17.0479 16.0531 17.6147 16.0063 17.7205 15.9969V13.521C21.3553 13.683 24.0674 14.3172 24.0674 15.0742C24.0674 15.833 21.3553 16.4653 17.7205 16.6265ZM17.7205 13.2633V11.0469H22.7924V7.66687H8.98297V11.0469H14.0548V13.2624C9.93289 13.4516 6.83301 14.2685 6.83301 15.2465C6.83301 16.2246 9.93289 17.0405 14.0548 17.2307V24.3335H17.7205V17.2288C21.8359 17.0396 24.9283 16.2236 24.9283 15.2465C24.9283 14.2695 21.8359 13.4535 17.7205 13.2633Z"
      fill="white"
    />
  </svg>
);
