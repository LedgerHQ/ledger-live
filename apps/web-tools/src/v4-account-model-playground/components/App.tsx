import React, { useCallback, useState } from "react";
import styled from "styled-components";
import AccountImportSection from "./AccountImportSection";
import AccountDisplaySection from "./AccountDisplaySection";
import TransactionalSection from "./TransactionalSection";
import OperationsSection from "./OperationsSection";
import BalanceHistorySection from "./BalanceHistorySection";

const Container = styled.div`
  padding: 0 16px 32px;
  max-width: 1240px;
  margin: 0 auto;
  font-family: sans-serif;
`;

const Header = styled.h1`
  margin: 0 0 16px;
`;

const Panels = styled.div`
  display: flex;
  gap: 24px;
  align-items: flex-start;
`;

const LeftPanel = styled.div`
  flex: 0 0 420px;
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const RightPanel = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
`;

export default function App() {
  const [accountsBeingUsed, setAccountsBeingUsed] = useState<string[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const handleAccountsBeingUsedChange = useCallback((ids: string[]) => {
    setAccountsBeingUsed(ids);
  }, []);

  const handleAddAccountsBeingUsed = useCallback((ids: string[]) => {
    setAccountsBeingUsed(prev => Array.from(new Set([...prev, ...ids])));
  }, []);

  return (
    <Container>
      <Header>V4 Account Model Playground</Header>

      <Panels>
        <LeftPanel>
          <AccountImportSection
            accountsBeingUsed={accountsBeingUsed}
            onAccountsBeingUsedChange={handleAccountsBeingUsedChange}
            onAddAccountsBeingUsed={handleAddAccountsBeingUsed}
          />
          <AccountDisplaySection
            accountsBeingUsed={accountsBeingUsed}
            selectedAccountId={selectedAccountId}
            onSelectedAccountIdChange={setSelectedAccountId}
          />
        </LeftPanel>

        <RightPanel>
          <OperationsSection
            accountsBeingUsed={accountsBeingUsed}
            selectedAccountId={selectedAccountId}
          />
          <BalanceHistorySection selectedAccountId={selectedAccountId} />
          <TransactionalSection
            accountsBeingUsed={accountsBeingUsed}
            selectedAccountId={selectedAccountId}
          />
        </RightPanel>
      </Panels>
    </Container>
  );
}
