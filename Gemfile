source "https://rubygems.org"

gem "fastlane"
gem "dotenv"
gem "cocoapods", "1.10.2"
gem "rake", "13.0.3"

plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
