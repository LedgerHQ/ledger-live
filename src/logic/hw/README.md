## hw: ledger device related code

- index.js contains code that merge & mashup all possible transports together.
- other files will be created temporarily until we "stabilize them" and put them in `live-common/lib/hw/*`

### APDU related functions

- each file exports a function with the shape `(transport, ?...args) => Observable<whatever>` or `(transport, ?...args) => Promise<whatever>`
- Observable is preferred when something is subject to interruption (e.g. genuine check)
- these function does not address open/close, nor they address the "queueing" problem. there are just light abstraction on top of APDU.
