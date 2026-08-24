!macro registerLedgerProtocol protocol
  DeleteRegKey SHELL_CONTEXT "Software\Classes\${protocol}"
  WriteRegStr SHELL_CONTEXT "Software\Classes\${protocol}" "" "Ledger Wallet"
  WriteRegStr SHELL_CONTEXT "Software\Classes\${protocol}" "URL Protocol" ""
  WriteRegStr SHELL_CONTEXT "Software\Classes\${protocol}\DefaultIcon" "" "$appExe,0"
  WriteRegStr SHELL_CONTEXT "Software\Classes\${protocol}\shell" "" ""
  WriteRegStr SHELL_CONTEXT "Software\Classes\${protocol}\shell\open" "" ""
  WriteRegStr SHELL_CONTEXT "Software\Classes\${protocol}\shell\open\command" "" '"$appExe" -- "%1"'
!macroend

!macro customInstall
  !insertmacro registerLedgerProtocol "ledgerwallet"
  !insertmacro registerLedgerProtocol "ledgerlive"
!macroend

!macro customUnInstall
  DeleteRegKey SHELL_CONTEXT "Software\Classes\ledgerlive"
  DeleteRegKey SHELL_CONTEXT "Software\Classes\ledgerwallet"
!macroend
