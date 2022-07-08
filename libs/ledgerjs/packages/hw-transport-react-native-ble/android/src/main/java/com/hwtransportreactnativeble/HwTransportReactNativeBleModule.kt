package com.hwtransportreactnativeble

import com.facebook.react.bridge.*
import com.hwtransportreactnativeble.tasks.Queue
import com.ledger.live.ble.BleManager
import timber.log.Timber

class HwTransportReactNativeBleModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    private var tag: String = "BleTransport"
    private var onDisconnect: ((Any) -> Void)? = null

    private var context: ReactApplicationContext = reactContext
    private var bleManager = BleManager.Companion.getInstance(context)
    private var eventEmitter = EventEmitter.getInstance(reactContext)
    private var queue: Queue? = null
    private var planted: Boolean = false

    override fun getName(): String {
        return "HwTransportReactNativeBle"
    }

    private fun onDisconnectWrapper(any: String) {
        onDisconnect?.let { it(any) }
    }

    @ReactMethod
    fun observeBluetooth() {
        if (!planted) {
            Timber.plant(Timber.DebugTree())
            planted = true
        }
    }

    @ReactMethod
    fun listen(promise: Promise) {
        Timber.d("$tag: \t start scanning")
        bleManager.startScanning {
            for (device in it) {
                eventEmitter.dispatch(Arguments.createMap().apply {
                    putString("event", "new-device")
                    putString("type", device.id)
                    putMap("data", Arguments.createMap().apply {
                        putString("uuid", device.id)
                        putString("name", device.name)
                        putString("service", device.serviceId)
                        putString("rssi", device.rssi.toString())
                    })
                })
            }
        }
        promise.resolve(1)
    }

    @ReactMethod
    fun stop(promise: Promise) {
        Timber.d("$tag: \t stop scanning")
        bleManager.stopScanning()
        promise.resolve(1)
    }

    @ReactMethod
    fun connect(uuid: String, promise: Promise) {
        Timber.d("$tag: \t Attempt to connect to $uuid")
        var consumed = false
        bleManager.connect(
            address = uuid,
            onConnectSuccess = {
                Timber.d("$tag: \t connection success")
                if (!consumed) {
                    promise.resolve(it.id)
                    consumed = true
                } else {
                    print("already consumed")
                }
            },
            onConnectError = {
                Timber.d("$tag: \t connection failure")
                if (!consumed) {
                    promise.reject("connectError", Exception(it))
                    consumed = true
                } else {
                    print("already consumed")
                }
            })
    }

    @ReactMethod
    fun onAppStateChange(awake: Boolean) {
        Timber.d("$tag: \t onAppStateChange triggered")
        eventEmitter.onAppStateChange(awake)
    }

    @ReactMethod
    fun disconnect(promise: Promise) {
        Timber.d("$tag: triggering disconnect")
        queue?.stop()
        if (bleManager.isConnected) {
            bleManager.disconnect {
                Timber.d("$tag: \t disconnected")
                promise.resolve(true)
            }
        } else {
            promise.resolve(true)
        }

    }

    @ReactMethod
    fun exchange(apdu: String, promise: Promise) {
        Timber.d("$tag: APDU -> $apdu")
        if (!bleManager.isConnected) {
            promise.reject("Device disconnected", Exception("Device disconnected"))
            return
        }
        bleManager.send(
            apduHex = apdu,
            onSuccess = {
                Timber.d("$tag: APDU <- $it")
                onDisconnect = null
                promise.resolve(it.replace(", ", ""))
            },
            onError = {
                Timber.d("$tag: APDU ERROR $it")
                onDisconnectWrapper(it)
            }
        )
    }

    @ReactMethod
    fun isConnected(promise: Promise) {
        Timber.d("$tag: \t isConnected ${bleManager.isConnected}")
        promise.resolve(bleManager.isConnected)
    }

    @ReactMethod
    fun queue(token: String, endpoint: String){
        if (queue != null && !queue!!.isStopped) {
            Timber.d("$tag: \t replacing queue token $token")
            queue!!.setNewToken(token)
            return
        }
        Timber.d("$tag: \t starting new queue $token")

        queue = Queue(token, endpoint, eventEmitter, bleManager)
    }
}

