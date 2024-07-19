import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Web3HubNavigator from "../Navigator";

export function Web3HubTest() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Web3HubNavigator />
    </QueryClientProvider>
  );
}
