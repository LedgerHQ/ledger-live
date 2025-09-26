!macro customInstall
  DeleteRegKey SHELL_CONTEXT "Software\Classes\ledgerwallet"
  WriteRegStr SHELL_CONTEXT "Software\Classes\ledgerwallet" "" "Ledger Wallet"
  WriteRegStr SHELL_CONTEXT "Software\Classes\ledgerwallet" "URL Protocol" ""
  WriteRegStr SHELL_CONTEXT "Software\Classes\ledgerwallet\DefaultIcon" "" "$appExe,0"
  WriteRegStr SHELL_CONTEXT "Software\Classes\ledgerwallet\shell" "" ""
  WriteRegStr SHELL_CONTEXT "Software\Classes\ledgerwallet\shell\open" "" ""
  WriteRegStr SHELL_CONTEXT "Software\Classes\ledgerwallet\shell\open\command" "" "$appExe %1"

  DeleteRegKey SHELL_CONTEXT "Software\Classes\ledgerlive"
  WriteRegStr SHELL_CONTEXT "Software\Classes\ledgerlive" "" "Ledger Wallet"
  WriteRegStr SHELL_CONTEXT "Software\Classes\ledgerlive" "URL Protocol" ""
  WriteRegStr SHELL_CONTEXT "Software\Classes\ledgerlive\DefaultIcon" "" "$appExe,0"
  WriteRegStr SHELL_CONTEXT "Software\Classes\ledgerlive\shell" "" ""
  WriteRegStr SHELL_CONTEXT "Software\Classes\ledgerlive\shell\open" "" ""
  WriteRegStr SHELL_CONTEXT "Software\Classes\ledgerlive\shell\open\command" "" "$appExe %1"
!macroend

!macro customUnInstall
  DeleteRegKey SHELL_CONTEXT "Software\Classes\ledgerlive"
!macroend
