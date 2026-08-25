working on https://ledgerhq.atlassian.net/browse/LIVE-36248

basically the idea for this is as follows:

- define a hook in platforms/contacts/device/ (idk where yet, depends on other files we'll need)
   - this hook returns:
      - deviceProps: the entire props objects that will be passed to a mounted DeviceIntentExecutor (

/grill-me