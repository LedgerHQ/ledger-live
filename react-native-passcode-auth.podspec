require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = "react-native-passcode-auth"
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = package['license']

  s.authors      = "Ledger"
  s.homepage     = "https://github.com/LedgerHQ/react-native-passcode-auth"
  s.platforms    = { :ios => "9.0", :tvos => "9.2" }

  s.source       = { :git => "https://github.com/LedgerHQ/react-native-passcode-auth", :tag => "v#{s.version}" }
  s.source_files  = "ios/**/*.{h,m}"

  s.dependency 'React'
end
