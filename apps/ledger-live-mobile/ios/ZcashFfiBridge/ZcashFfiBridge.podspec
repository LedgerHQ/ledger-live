# The React Native bridge to the Zcash engine, shipped with the prebuilt
# XCFramework it wraps.
#
# Why a pod rather than files in the app target: CocoaPods links the vendored
# framework and compiles the bridge without an edit to ledgerlivemobile.xcodeproj,
# and the Podfile can skip the whole thing when the binaries are absent. That is
# the availability switch -- no `#if` guards, no preprocessor flags: no pod means
# no `ZcashFfiModule`, and the JS layer answers "unavailable".
#
# Why the pod is NOT called ZcashFfiMobile: under `use_frameworks!` CocoaPods
# gives every pod a Clang module named after the pod. A pod named ZcashFfiMobile
# would therefore shadow the vendored framework's own module of that name, and
# `import ZcashFfiMobile` from ZcashFfiModule.swift would resolve to the pod
# itself -- leaving the C functions undefined. The bridge and the engine must
# keep distinct module names.
#
# The .xcframework is not committed (~4 MB of binaries). Fetch it with
# `scripts/sync-zcash-ffi.sh`, then run `pnpm pod`.

Pod::Spec.new do |s|
  s.name             = 'ZcashFfiBridge'
  s.version          = '0.1.0'
  s.summary          = 'React Native bridge to the prebuilt Zcash key-derivation engine (C ABI).'
  s.description      = <<~DESC
    Wraps the iOS slice of the `zcash-ffi-mobile` crate in
    LedgerHQ/ledger-zcash-utils -- the same Rust engine desktop loads as a Node
    addon, exposed over a C ABI. Headers ship inside each framework slice, so
    the bridge can `import ZcashFfiMobile` directly.
  DESC
  s.homepage         = 'https://github.com/LedgerHQ/ledger-zcash-utils'
  s.license          = { :type => 'MIT OR Apache-2.0' }
  s.author           = 'Ledger'
  s.platform         = :ios, '15.1'
  s.swift_version    = '5.0'
  s.source           = { :http => 'https://github.com/LedgerHQ/ledger-zcash-utils' }

  s.source_files        = '*.{swift,m}'
  s.vendored_frameworks = 'ZcashFfiMobile.xcframework'

  s.dependency 'React-Core'
end
