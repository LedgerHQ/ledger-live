## BLE implementation of hw-transport

The code will remain private until the release because we must not leak technical names.

### GRE's notes

I’ve worked with Philippe at the end of this afternoon. It’s very early stage and experimental. highly unstable too. but _“it’s working!“_. I was able to run the PoC code so it’s kinda already “feature complete” from the dev/frontend side. We were able to test 2 kinds of “pairing”: the usual pairing where you have to set a code on the app and the “numerical comparison” one. In term of security, the “numerical comparison” is the target for the firmware team. however we were only able to make it work on Android and it was VERY unstable (only work 10% of time). The “normal pairing” will be a fallback if we can’t figure it out. Also we’re having hard time on iOS: the scanning discovering works once, then the device is never found again! we have to change the mac address to make it work again. so TLDR: many bugs, many remaining investigation to be done (for hardware team).

two notes that might impact design:

- on Android, there will be a permission popup to access “location”. this is needed for bluetooth. no design required.
- we technically can’t implement the “verify this number” screen; everything works with OS’ native popups (kinda like a permission). and this is true for both “pairing modes”

also, just a note: the targetted “numerical comparison” requires relatively recent devices that implement “BLE v4.2" and above. but hopefully a fallback is implmeented in the protocol.. but that means we don’t really know which pairing mode will be used at the end, it can be either the first or the second, but from our app side, we don’t really care, it’s all handled at OS and firmware update :pray: ( http://blog.bluetooth.com/bluetooth-pairing-part-4 )

for iOS, i kinda wonder if we’re stuck because of https://github.com/Polidea/react-native-ble-plx/pull/332
