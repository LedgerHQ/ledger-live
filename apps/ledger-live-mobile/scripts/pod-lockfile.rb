# Resolves the Podfile and writes Podfile.lock without downloading or integrating pods, so it also runs on Linux.
require 'cocoapods'

Dir.chdir(File.join(__dir__, '..', 'ios'))
config = Pod::Config.instance
installer = Pod::Installer.new(config.sandbox, config.podfile, config.lockfile)
installer.repo_update = true
installer.send(:prepare)
installer.resolve_dependencies
installer.send(:generate_lockfile).write_to_disk(config.lockfile_path)
