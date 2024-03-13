import React from "react";
import Container from "./components/Container";
import { Account } from "@ledgerhq/types-live";
import Header from "./components/Header";

type Props = { account: Account };

const Ordinals = ({ account }: Props) => {
  console.log(account.id);

  return (
    <Container>
      <Header />
    </Container>
  );
};

export default Ordinals;
