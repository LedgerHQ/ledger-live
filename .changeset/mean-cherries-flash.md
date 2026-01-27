---
"@ledgerhq/live-common": minor
---

fix: use tldts for subdomain-agnostic domain matching

- Use tldts library's getDomain function
- Implement subdomain matching in isSameDomain (app.example.com now matches api.example.com)
- Optimize URL parsing with shared parseUrl helper to create single URL object
- Remove unused getDomain and getProtocol helper functions
- Add test coverage for:
  - Complex TLDs (.co.uk, etc.)
  - Localhost and IP address edge cases
  - Multiple subdomain levels
  - Base domain to subdomain matching
