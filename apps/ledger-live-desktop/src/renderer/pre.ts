// catch all errors during the loading of the app. it will be unset in index.ts at the same time we finish loading it.
window.onerror = e => {
  const pre = document.createElement("pre");
  pre.innerHTML = `Ledger Live crashed. Please contact Ledger support.
        ${String(e)}`;
  document.body.style.padding = "50px";
  document.body.innerHTML = "";
  document.body.style.backgroundColor = "#fff";
  document.body.appendChild(pre);
};
