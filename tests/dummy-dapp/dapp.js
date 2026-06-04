const output = document.getElementById("output");
let announcedProvider;
let announcedProviderInfo;
let currentAccount;

const appendLine = text => {
  const line = document.createElement("div");
  line.textContent = text;
  output.appendChild(line);
};

const request = (provider, method, params = []) =>
  provider.request({
    method,
    params,
  });

window.addEventListener("eip6963:announceProvider", event => {
  announcedProvider = event.detail.provider;
  announcedProviderInfo = event.detail.info;
});

document.querySelector("#provider > button").addEventListener("click", async () => {
  output.replaceChildren();
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  const provider = announcedProvider || window.ethereum;
  if (!provider) {
    appendLine("Provider not found");
    return;
  }

  const chainId = await request(provider, "eth_chainId");
  const accounts = await request(provider, "eth_accounts");
  currentAccount = accounts[0];
  const network = Number.parseInt(chainId, 16).toString();

  appendLine(`Name: ${announcedProviderInfo?.name || "Ledger Live"}`);
  appendLine(`Network: ${network}`);
  appendLine(`ChainId: ${chainId}`);
  appendLine(`Accounts: ${accounts.join(", ")}`);
});

document.getElementById("getAccounts").addEventListener("click", async () => {
  const provider = announcedProvider || window.ethereum;
  const accounts = await request(provider, "eth_accounts");
  currentAccount = accounts[0];
  appendLine(`eth_accounts result: ${accounts.join(", ")}`);
});

document.getElementById("personalSign").addEventListener("click", async () => {
  const provider = announcedProvider || window.ethereum;
  const account = currentAccount || (await request(provider, "eth_accounts"))[0];
  const message = "0x4c6564676572204c697665206c6f63616c2064617070";
  const result = await request(provider, "personal_sign", [message, account]);
  appendLine(`personal_sign result: ${result}`);
});
