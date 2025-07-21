source "https://rubygems.org"

gem "fastlane", '~> 2.223.1'
gem 'activesupport', '>= 6.1.7.5', '!= 7.1.0'
gem "dotenv"
gem 'cocoapods', '>= 1.13', '!= 1.15.0', '!= 1.15.1', '!= 1.16.0', '!= 1.16.1', '!= 1.16.2'
gem "semver2", "~> 3.4", ">= 3.4.2"
gem 'xcodeproj', '< 1.26.0'
gem 'concurrent-ruby', '< 1.3.4'

plugins_path = File.join(File.dirname(__FILE__), "fastlane", "Pluginfile")
eval_gemfile(plugins_path) if File.exist?(plugins_path)

