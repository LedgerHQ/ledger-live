# The hotfix had some merge conflicts :rotating_light:

This pull request was created in order to resolve the merge conflicts between the hotfix and release branches.

```bash
git checkout release && git pull

git checkout support/hotfix-release-merge-conflicts

git merge release
```

## Checklist

To be ready to be merged, we must comply with all theses checks:

- [ ] all CI checks have passed
- [ ] reviews of the code owners impacted by the conflict
