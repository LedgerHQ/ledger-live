import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
  jettonTransferResponse,
  jettonWallets,
  lastBlockNumber,
  tonAccount,
  tonEstimateFee,
  tonTransactionResponse,
  tonWallet,
} from "./common.fixtures";

// Define the mock base URL for the TON API
export const API_TON_ENDPOINT = "https://ton.coin.ledger.com/api/v3";

// Create request handlers for the mock server
const handlers = [
  // Handle GET request for masterchainInfo endpoint
  http.get(`${API_TON_ENDPOINT}/masterchainInfo`, () => {
    return HttpResponse.json(lastBlockNumber);
  }),
  // Handle GET request for transactions endpoint
  http.get(`${API_TON_ENDPOINT}/transactions`, () => {
    return HttpResponse.json(tonTransactionResponse);
  }),
  // Handle GET request for account endpoint
  http.get(`${API_TON_ENDPOINT}/account`, () => {
    return HttpResponse.json(tonAccount);
  }),
  // Handle GET request for wallet endpoint
  http.get(`${API_TON_ENDPOINT}/wallet`, () => {
    return HttpResponse.json(tonWallet);
  }),
  // Handle GET request for jetton transfers endpoint
  http.get(`${API_TON_ENDPOINT}/jetton/transfers`, () => HttpResponse.json(jettonTransferResponse)),
  // Handle GET request for jetton wallets endpoint
  http.get(`${API_TON_ENDPOINT}/jetton/wallets`, () => HttpResponse.json(jettonWallets)),

  // Handle POST request for estimate fee endpoint
  http.post(`${API_TON_ENDPOINT}/estimateFee`, () => HttpResponse.json(tonEstimateFee)),
];

// Set up the mock server with the defined handlers
const mockServer = setupServer(...handlers);

export default mockServer;
