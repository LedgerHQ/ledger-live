import test from "../../fixtures/common";
import { expect, Page } from "@playwright/test";
import { AccountsPage } from "../../page/accounts.page";
import { Layout } from "../../component/layout.component";
import { Modal } from "../../component/modal.component";
import { EvmDelegateModal } from "tests/page/modal/evmDelegate.modal";

const SEI_EVM_RPC_ORIGIN = "https://sei-evm.coin.ledger.com";
const SEI_VALIDATORS_ORIGIN = "https://rest.sei-apis.com";
const SEI_VALIDATORS_PATHNAME = "/cosmos/staking/v1beta1/validators";
const SEI_OPERATIONS_ORIGIN = "https://proxyetherscan.api.live.ledger.com";
const SEI_OPERATIONS_ACTIONS = new Set([
  "txlist",
  "txlistinternal",
  "tokentx",
  "tokennfttx",
  "token1155tx",
]);
const SEI_EVM_CHAIN_ID = 1329;
const MOCKED_NATIVE_BALANCE_HEX = "0x8ac7230489e80000";
const MOCKED_GAS_LIMIT_HEX = "0x186a0";
const MOCKED_GAS_PRICE_HEX = "0x3b9aca00";
const MOCKED_MAX_PRIORITY_FEE_HEX = "0x3b9aca00";
const STAKED_ACCOUNT_ADDRESS = "0x18E9A4F2A5A2B01F35E7D086E75D7D01530A1A9F";
const MOCKED_SEI_VALIDATOR_1 = "seivaloper1mockvalidator000000000000000000000001";
const MOCKED_SEI_VALIDATOR_2 = "seivaloper1mockvalidator000000000000000000000002";
const MOCKED_SEI_VALIDATOR_3 = "seivaloper1mockvalidator000000000000000000000003";
const LEDGER_BY_FIGMENT = "Ledger by Figment";
const EMPTY_SEI_DELEGATION_RESULT =
  "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000004757365690000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000011736569316d6f636b64656c656761746f72000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003073656976616c6f706572316d6f636b76616c696461746f7230303030303030303030303030303030303030303030303300000000000000000000000000000000";
const STAKED_SEI_DELEGATION_RESULT_BY_VALIDATOR: Record<string, string> = {
  [MOCKED_SEI_VALIDATOR_1]:
    "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000002625a0000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000047573656900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000002625a0000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000011736569316d6f636b64656c656761746f72000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003073656976616c6f706572316d6f636b76616c696461746f7230303030303030303030303030303030303030303030303100000000000000000000000000000000",
  [MOCKED_SEI_VALIDATOR_2]: EMPTY_SEI_DELEGATION_RESULT,
  [MOCKED_SEI_VALIDATOR_3]: EMPTY_SEI_DELEGATION_RESULT,
};

type JsonRpcRequest = {
  id?: number | string | null;
  jsonrpc?: string;
  method: string;
  params?: unknown[];
};
type JsonRpcSuccessResponse = { id: number | string | null; jsonrpc: "2.0"; result: unknown };
type JsonRpcErrorResponse = {
  id: number | string | null;
  jsonrpc: "2.0";
  error: { code: number; message: string };
};
type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;

const asciiToHex = (value: string) =>
  Array.from(value)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");

function getMockedSeiDelegationResult(params?: unknown[]): string {
  const callData =
    params?.[0] && typeof params[0] === "object" && "data" in params[0]
      ? String((params[0] as { data?: unknown }).data).toLowerCase()
      : "";

  if (!callData.includes(STAKED_ACCOUNT_ADDRESS.toLowerCase().slice(2))) {
    return EMPTY_SEI_DELEGATION_RESULT;
  }

  const validator = [MOCKED_SEI_VALIDATOR_1, MOCKED_SEI_VALIDATOR_2, MOCKED_SEI_VALIDATOR_3].find(
    validator => callData.includes(asciiToHex(validator)),
  );

  return validator
    ? STAKED_SEI_DELEGATION_RESULT_BY_VALIDATOR[validator]
    : EMPTY_SEI_DELEGATION_RESULT;
}

function handleSeiEvmRpcCall(request: JsonRpcRequest): JsonRpcResponse {
  const { id, method, params } = request;
  const respond = (result: unknown): JsonRpcResponse => ({
    id: id ?? null,
    jsonrpc: "2.0",
    result,
  });

  switch (method) {
    case "eth_chainId":
      return respond("0x" + SEI_EVM_CHAIN_ID.toString(16));
    case "eth_blockNumber":
      return respond("0x186a0");
    case "eth_getBlockByNumber":
      return respond({
        number: "0x186a0",
        hash: "0x" + "00".repeat(32),
        parentHash: "0x" + "00".repeat(32),
        timestamp: "0x6543b1c0",
        baseFeePerGas: "0x3b9aca00",
        gasLimit: "0x1c9c380",
        gasUsed: "0x0",
        miner: "0x" + "00".repeat(20),
        difficulty: "0x0",
        totalDifficulty: "0x0",
        extraData: "0x",
        size: "0x0",
        transactions: [],
        uncles: [],
      });
    case "eth_getBalance":
      return respond(MOCKED_NATIVE_BALANCE_HEX);
    case "eth_getTransactionCount":
      return respond("0x0");
    case "eth_gasPrice":
      return respond(MOCKED_GAS_PRICE_HEX);
    case "eth_maxPriorityFeePerGas":
      return respond(MOCKED_MAX_PRIORITY_FEE_HEX);
    case "eth_feeHistory":
      return respond({
        oldestBlock: "0x186a0",
        baseFeePerGas: ["0x3b9aca00", "0x3b9aca00"],
        gasUsedRatio: [0.5],
        reward: [["0x3b9aca00"]],
      });
    case "eth_estimateGas":
      return respond(MOCKED_GAS_LIMIT_HEX);
    case "eth_call":
      return respond(getMockedSeiDelegationResult(params));
    case "eth_getCode":
      return respond("0x");
    case "net_version":
      return respond(SEI_EVM_CHAIN_ID.toString());
    default:
      return {
        id: id ?? null,
        jsonrpc: "2.0",
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, GET, OPTIONS",
  "access-control-allow-headers": "*",
};

const normalizePathname = (pathname: string) => pathname.replace(/^\/+/, "/");

function stringifySeiEvmRpcResponse(rawPostData: string): string {
  let payload: JsonRpcRequest | JsonRpcRequest[];
  try {
    payload = JSON.parse(rawPostData || "{}");
  } catch {
    return JSON.stringify({
      id: null,
      jsonrpc: "2.0",
      error: { code: -32700, message: "Parse error" },
    });
  }

  const response = Array.isArray(payload)
    ? payload.map(handleSeiEvmRpcCall)
    : handleSeiEvmRpcCall(payload);

  return JSON.stringify(response);
}

async function mockSeiEvmRpc(page: Page) {
  await page.exposeFunction("mockSeiEvmRpcResponse", stringifySeiEvmRpcResponse);
  await page.evaluate(
    ({ rpcOrigin, headers }) => {
      const originalFetch = window.fetch.bind(window);

      window.fetch = async (input, init) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : input.toString();

        if (url === rpcOrigin || url.startsWith(`${rpcOrigin}/`)) {
          let body = init?.body;
          if (!body && input instanceof Request) {
            body = await input.clone().text();
          }

          const requestBody =
            typeof body === "string" ? body : body ? await new Response(body).text() : "{}";
          const responseBody = await (
            window as typeof window & {
              mockSeiEvmRpcResponse: (body: string) => Promise<string>;
            }
          ).mockSeiEvmRpcResponse(requestBody);

          return new Response(responseBody, {
            status: 200,
            statusText: "OK",
            headers: { ...headers, "content-type": "application/json", teststatus: "mocked" },
          });
        }

        return originalFetch(input, init);
      };
    },
    { rpcOrigin: SEI_EVM_RPC_ORIGIN, headers: CORS_HEADERS },
  );
}

const MOCKED_SEI_EMPTY_REDELEGATIONS = { redelegation_responses: [] };
const MOCKED_SEI_VALIDATORS = {
  validators: [
    {
      operator_address: MOCKED_SEI_VALIDATOR_1,
      description: { moniker: LEDGER_BY_FIGMENT },
      commission: { commission_rates: { rate: "0.050000000000000000" } },
      tokens: "123456789000000",
    },
    {
      operator_address: MOCKED_SEI_VALIDATOR_2,
      description: { moniker: "Chorus One" },
      commission: { commission_rates: { rate: "0.070000000000000000" } },
      tokens: "99000000000000",
    },
    {
      operator_address: MOCKED_SEI_VALIDATOR_3,
      description: { moniker: "Everstake" },
      commission: { commission_rates: { rate: "0.100000000000000000" } },
      tokens: "77000000000000",
    },
  ],
};

async function mockSeiValidatorsApi(page: Page) {
  await page.route(`${SEI_VALIDATORS_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = normalizePathname(url.pathname);

    const isValidatorsListRequest =
      request.method() === "GET" &&
      pathname === normalizePathname(SEI_VALIDATORS_PATHNAME) &&
      url.searchParams.get("status") === "BOND_STATUS_BONDED" &&
      url.searchParams.get("pagination.limit") === "200";

    if (isValidatorsListRequest) {
      await route.fulfill({
        headers: { ...CORS_HEADERS, teststatus: "mocked" },
        contentType: "application/json",
        body: JSON.stringify(MOCKED_SEI_VALIDATORS),
      });
      return;
    }

    const isRedelegationsRequest =
      request.method() === "GET" &&
      pathname.includes("/cosmos/staking/v1beta1/delegators/") &&
      pathname.endsWith("/redelegations");

    if (isRedelegationsRequest) {
      await route.fulfill({
        headers: { ...CORS_HEADERS, teststatus: "mocked" },
        contentType: "application/json",
        body: JSON.stringify(MOCKED_SEI_EMPTY_REDELEGATIONS),
      });
      return;
    }

    throw new Error(`Unexpected SEI REST staking request: ${request.method()} ${url.toString()}`);
  });
}

async function mockSeiOperationsApi(page: Page) {
  await page.route(`${SEI_OPERATIONS_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const isExpectedRequest =
      request.method() === "GET" &&
      url.searchParams.get("module") === "account" &&
      SEI_OPERATIONS_ACTIONS.has(url.searchParams.get("action") ?? "");

    if (!isExpectedRequest) {
      throw new Error(`Unexpected SEI operations request: ${request.method()} ${url.toString()}`);
    }

    await route.fulfill({
      headers: { ...CORS_HEADERS, teststatus: "mocked" },
      contentType: "application/json",
      body: JSON.stringify({ status: "0", message: "No transactions found", result: [] }),
    });
  });
}

test.use({
  userdata: "accountSeiEvmStaking",
  featureFlags: {
    evmNativeStaking: {
      enabled: true,
      params: {
        supportedCurrencyIds: ["sei_evm"],
      },
    },
  },
});

let modalPage: Modal;
let delegate: EvmDelegateModal;
let accountsPage: AccountsPage;

test.beforeEach(async ({ page }) => {
  await mockSeiValidatorsApi(page);
  await mockSeiOperationsApi(page);
  await mockSeiEvmRpc(page);

  const layout = new Layout(page);
  await layout.goToAccounts();
  modalPage = new Modal(page);
  accountsPage = new AccountsPage(page);
});

test("EVM Native Staking - Delegate happy path (sei_evm) @smoke", async ({ page }) => {
  await accountsPage.navigateToAccountByName("SEI Network (EVM) 1");
  delegate = new EvmDelegateModal(page);
  await delegate.startFromEmptyState();

  await test.step("start the evm delegate flow", async () => {
    await expect.soft(modalPage.container).toHaveScreenshot(`evm-earn-reward-pre-flow-page.png`);
  });

  await test.step("validator list is shown", async () => {
    await delegate.continue();
    await delegate.waitForValidatorListVisible();
    await delegate.verifyProviderIsShown(LEDGER_BY_FIGMENT);
    await delegate.selectProviderByName(LEDGER_BY_FIGMENT);
  });

  await test.step("toggle max amount to be filled in the amount field", async () => {
    await delegate.delegateContinue();
    await page.waitForSelector("[data-testid='modal-max-checkbox']");
    await page.focus("[data-testid='modal-amount-field']");
    await delegate.toggleMaxAmount();
    const availableMaxAmount = await delegate.getSpendableBannerValue();
    await delegate.waitForCryptoAmountToBePopulated();
    const filledMaxAmount = await delegate.getCryptoAmount();
    expect(filledMaxAmount).toEqual(availableMaxAmount);
    await expect.soft(modalPage.container).toHaveScreenshot(`evm-staking-max-amount-page.png`);
  });
});

test("EVM Native Staking - Delegated validator is rendered (sei_evm) @smoke", async ({ page }) => {
  await accountsPage.navigateToAccountByName("SEI Network (EVM) Staked");

  await test.step("after delegation to validator, it is shown in the list", async () => {
    await expect(page.locator('[data-e2e="title_Delegation"]')).toBeVisible();
    await expect(page.getByText(LEDGER_BY_FIGMENT).first()).toBeVisible();
    await expect(page.getByText("Delegated assets").first()).toBeVisible();
    await expect(page.locator("#account-delegate-button")).toBeEnabled();
  });
});
