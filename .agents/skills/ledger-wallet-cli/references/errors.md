# Errors: device, account and amount

This table covers commands outside `agent-intent`, which carries its own error table. Errors specific to `ring`, `swap` and `earn` are at the end of [ring.md](ring.md), [swap.md](swap.md) and [earn.md](earn.md).

Device errors print `[✖] <message>` (or a `device-state` object with `--output json`) and set the exit code: 1 generic, 2 rejected on device, 3 not detected, 4 wrong app, 5 app not installed, 6 timeout or locked. Messages are substrings of the CLI output. Find the row before any retry: each row says whether the retry is yours or the human's.

When the CLI saw a USB Ledger but could not open it, the error also names that failure: `error.usb_access_error` holds the libusb or OS error (e.g. `LIBUSB_ERROR_ACCESS`), and `error.hint` names the usual fixes when the CLI knows them. Human output prints both on the line under the message. They add to the row; the message and the exit code stay the row's.

| Message | Exit | Cause | Action |
|---|---|---|---|
| `Ledger not detected. Plug in, unlock, retry.` | 3 | no device on this machine, or it is off or unplugged | follow SKILL.md, [No USB on this machine](../SKILL.md#no-usb-on-this-machine) |
| `No Ledger device found. Unlock the device and try again.` | 1 | no Ledger answered within the 60 s discovery wait; with `usb_access_error`, the CLI saw a Ledger it could not open and stopped at once | without `usb_access_error`, ask the human whether the Ledger is plugged in and unlocked, then re-run. With `LIBUSB_ERROR_NO_DEVICE` or `LIBUSB_ERROR_ACCESS` on a Device = yes command that ran inside the sandbox, apply SKILL.md, Host sandbox ([Safety rules](../SKILL.md#safety-rules)) and re-run; if it already ran outside the sandbox, do not bypass again: ask the human to close Ledger Live or whatever else holds the device and, on Linux, to install the Ledger udev rules. With `LIBUSB_ERROR_BUSY`, ask the human to close Ledger Live or whatever else holds the device |
| any other failure of `send`, `earn deposit` / `withdraw` or `swap execute` after the human approved on the device (e.g. a network error or a timeout) | 1 | the transaction may have been broadcast anyway | never re-run on your own: run `operations <label> --limit 5 --output json` and look for an operation with that recipient and amount since the run; if one is there, give the human its `hash`; if not, tell them it may still land and re-run only on their explicit yes |
| `Rejected on device. No action taken.` | 2 | the human rejected a signature | a deliberate choice: ask whether to retry or abort, never retry on your own; on retry, have them check amount, recipient and fees on the device |
| `Rejected on device. App was not opened.` | 2 | the human rejected the app-open prompt | ask them to confirm the prompt, then re-run |
| `Rejected on device. Address not confirmed.` | 2 | the human rejected the address on `receive` | ask whether the addresses matched; on a mismatch apply the receive rule in SKILL.md, Core commands |
| `Wrong app` ... `Open Ledger dashboard.` | 4 | `genuine-check` while a coin app is open; it targets the dashboard and cannot switch apps itself | ask the human to quit the app (press both buttons on the app's main screen until `Quit` shows, then confirm), then re-run. Other device commands open the right app themselves |
| `app is not installed. Install it via Ledger Live and retry.` | 5 | coin app missing on the device | the human installs it with Ledger Live, then re-run |
| `Ledger is locked. Unlock your device with your PIN and retry.` | 6 | device locked past the wait | the human unlocks it, then re-run |
| `Timed out talking to the Ledger over USB. The device may be busy or locked.` | 6 | host sandbox blocking USB, or device busy or locked | on a Device = yes command, apply SKILL.md, Host sandbox ([Safety rules](../SKILL.md#safety-rules)) and re-run; on any other command, investigate instead of bypassing |
| `Speculos not reachable at` | 3 | `SPECULOS_API_PORT` is set, but no Speculos answers there or the connect fails | ask the human to start Speculos, fix the variables, or unset them to use a USB Ledger |
| `Timed out talking to Speculos at` | 6 | the emulated app waits for a button press, the connect got no answer, or Speculos runs another app than the command needs | tell the human the flow needs an on-device approval, or that Speculos is down or runs an app this command does not use |
| `[object Object]` or garbled APDU output | any | two device commands ran in parallel | run device commands one at a time |
| `device-state` with `awaiting_approval` and reason `unlock` (`Ledger is locked. Enter your PIN on the device.`) | none yet | device locked | keep the command running; it resumes once the human enters their PIN |
| `Missing account: use --account <session-label>` | 1 | no label given, or the session has none | pass a label; with an empty session run `account discover <network>` first |
| `Amount must include a ticker` | 1 | `--amount` without a ticker | ask the human which asset they mean, then pass it inline: `--amount '0.5 ETH'` |
| `Ticker "..." not found in account. Available: ...` | 1 | the account does not hold that asset | show the human the available tickers (also `balances <label>`) and ask which one, or whether they meant another account; keep their ticker until they choose |
