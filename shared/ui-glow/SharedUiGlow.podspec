require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "SharedUiGlow"
  # Fixed: a release bump of the package must not change Podfile.lock (`pod install --deployment`)
  s.version      = "0.0.0"
  s.summary      = package["description"]
  s.homepage     = "https://github.com/LedgerHQ/ledger-live/tree/develop/shared/ui-glow"
  s.license      = "MIT"
  s.authors      = "Ledger SAS"
  s.source       = { :git => "https://github.com/LedgerHQ/ledger-live.git" }

  s.platforms    = { :ios => "16.4" }
  s.source_files = "ios/**/*.{h,m,mm}"
  s.frameworks   = "Metal", "MetalKit"

  # Fabric component: codegen headers, React-Core and the C++ renderer.
  install_modules_dependencies(s)
end
