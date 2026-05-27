# Workaround for "ArgumentError - pathname contains null byte" raised by
# CocoaPods 1.14.x when Pathname#realdirpath resolves pnpm-style symlinks under
# node_modules. Swaps realdirpath -> cleanpath; the rest of the method body
# (including the .lproj variant-group handling) is copied verbatim from
# cocoapods-1.14.3/lib/cocoapods/project.rb to avoid regressing localized pods.
#
# Track removal: see Jira ticket linked from the matching changeset.
# Upstream: https://github.com/CocoaPods/CocoaPods/issues/12798
#          https://github.com/CocoaPods/CocoaPods/issues/12866

module CocoaPodsPathnameWorkaround
  def group_for_path_in_group(absolute_pathname, group, reflect_file_system_structure, base_path = nil)
    unless absolute_pathname.absolute?
      raise ArgumentError, "Paths must be absolute #{absolute_pathname}"
    end
    unless base_path.nil? || base_path.absolute?
      raise ArgumentError, "Paths must be absolute #{base_path}"
    end

    relative_base = base_path.nil? ? group.real_path : base_path.cleanpath
    relative_pathname = absolute_pathname.relative_path_from(relative_base)
    relative_dir = relative_pathname.dirname

    if reflect_file_system_structure
      path = relative_base
      relative_dir.each_filename do |name|
        break if name.to_s.downcase.include? '.lproj'
        next if name == '.'

        path += name
        group = group.children.find { |c| c.display_name == name } || group.new_group(name, path)
      end
    end

    if relative_dir.basename.to_s.downcase.include? '.lproj'
      group_name = variant_group_name(absolute_pathname)
      lproj_parent_dir = absolute_pathname.dirname.dirname
      group = @variant_groups_by_path_and_name[[lproj_parent_dir, group_name]] ||=
                group.new_variant_group(group_name, lproj_parent_dir)
    end

    group
  end
end

Pod::Project.prepend(CocoaPodsPathnameWorkaround)
