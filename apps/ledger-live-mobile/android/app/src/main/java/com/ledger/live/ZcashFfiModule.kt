package com.ledger.live;

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Bridges the Zcash key-derivation engine to JavaScript.
 *
 * The engine is the Rust crate `zcash-ffi-mobile` from
 * LedgerHQ/ledger-zcash-utils -- the same code desktop loads as a Node addon,
 * which cannot run inside a React Native bundle. It arrives as a prebuilt
 * per-ABI `libzcash_ffi_mobile.so` fetched by `scripts/sync-zcash-ffi.sh` and
 * dropped in `jniLibs`, which Gradle packages with no build configuration of
 * its own.
 *
 * The library carries its own JNI entry points: it exports `JNI_OnLoad`, and
 * the JVM calls that on load to receive the method table backing the
 * `external fun`s below. There is no C++ shim, no CMake and no NDK in this
 * app's build -- deliberately, because React Native owns the app module's one
 * `externalNativeBuild` slot and taking it broke `libappmodules.so`.
 *
 * This module is registered unconditionally. It must be: probing availability
 * at registration time would load the library during bridge initialisation on
 * every launch, whether or not anything Zcash is used. A build without the
 * engine answers [CODE_UNAVAILABLE] on first call instead, which is what the
 * JS layer already reads as "engine unavailable".
 */
class ZcashFfiModule(
    reactContext: ReactApplicationContext,
    coroutineDispatcher: CoroutineDispatcher = Dispatchers.Default
) : ReactContextBaseJavaModule(reactContext) {

    // Derivation is a few milliseconds of pure CPU work. That is short, but the
    // React Native modules thread is shared by every native call, so it does
    // not belong there.
    private val coroutineScope = CoroutineScope(coroutineDispatcher)

    override fun getName() = NAME

    /**
     * Derives the Orchard-only unified address the device displays.
     *
     * Never log `ufvk` or a failure detail: a viewing key exposes the account's
     * entire history. The Rust layer keeps key material out of its error
     * strings; this side must not put it back.
     */
    @ReactMethod
    fun deriveOrchardAddress(ufvk: String, promise: Promise) {
        coroutineScope.launch {
            if (!libraryLoaded) {
                promise.reject(CODE_UNAVAILABLE, MESSAGE_UNAVAILABLE)
                return@launch
            }

            // The engine reports a status alongside the string, and JNI has no
            // out parameters -- hence the one-element array.
            val status = IntArray(1)

            val value =
                try {
                    nativeDeriveOrchardAddress(ufvk, status)
                } catch (error: UnsatisfiedLinkError) {
                    // The library loaded but the method table did not register.
                    promise.reject(CODE_UNAVAILABLE, MESSAGE_UNAVAILABLE)
                    return@launch
                }

            when {
                value == null ->
                    promise.reject(errorCode(status[0]), "Zcash FFI returned no value")
                status[0] == ZCASH_OK -> promise.resolve(value)
                // On a failure the string carries the message, not an address.
                else -> promise.reject(errorCode(status[0]), value)
            }
        }
    }

    /**
     * Runs the threading probe and resolves with its JSON result.
     *
     * Diagnostic only, and the reason it exists on Android at all: every
     * parallelism figure we hold was measured on iOS. Read it as "does Rayon
     * get a real thread pool on this device", never as a sync-throughput
     * number -- the workload is repeated address derivation, not block scanning.
     */
    @ReactMethod
    fun threadProbe(ufvk: String, iterations: Int, promise: Promise) {
        coroutineScope.launch {
            if (!libraryLoaded) {
                promise.reject(CODE_UNAVAILABLE, MESSAGE_UNAVAILABLE)
                return@launch
            }

            val status = IntArray(1)

            val value =
                try {
                    nativeThreadProbe(ufvk, iterations, status)
                } catch (error: UnsatisfiedLinkError) {
                    promise.reject(CODE_UNAVAILABLE, MESSAGE_UNAVAILABLE)
                    return@launch
                }

            when {
                value == null ->
                    promise.reject(errorCode(status[0]), "Zcash FFI returned no value")
                status[0] == ZCASH_OK -> promise.resolve(value)
                else -> promise.reject(errorCode(status[0]), value)
            }
        }
    }

    /**
     * Scans a block range and resolves with the serialised result.
     *
     * Blocking for the whole range, hence the dispatcher: there is no progress
     * and no cancellation, so keep the range small. A full history belongs to
     * the streaming design, not to this call.
     */
    @ReactMethod
    fun syncRange(
        ufvk: String,
        grpcUrl: String,
        network: String,
        startHeight: Int,
        endHeight: Int,
        promise: Promise
    ) {
        coroutineScope.launch {
            if (!libraryLoaded) {
                promise.reject(CODE_UNAVAILABLE, MESSAGE_UNAVAILABLE)
                return@launch
            }

            val status = IntArray(1)

            val value =
                try {
                    nativeSyncRange(ufvk, grpcUrl, network, startHeight, endHeight, status)
                } catch (error: UnsatisfiedLinkError) {
                    // The engine was built without the `sync` feature, so
                    // JNI_OnLoad never registered this method.
                    promise.reject(CODE_UNAVAILABLE, MESSAGE_UNAVAILABLE)
                    return@launch
                }

            when {
                value == null ->
                    promise.reject(errorCode(status[0]), "Zcash FFI returned no value")
                status[0] == ZCASH_OK -> promise.resolve(value)
                else -> promise.reject(errorCode(status[0]), value)
            }
        }
    }

    private external fun nativeDeriveOrchardAddress(ufvk: String, outStatus: IntArray): String?

    private external fun nativeSyncRange(
        ufvk: String,
        grpcUrl: String,
        network: String,
        startHeight: Int,
        endHeight: Int,
        outStatus: IntArray
    ): String?

    private external fun nativeThreadProbe(
        ufvk: String,
        iterations: Int,
        outStatus: IntArray
    ): String?

    companion object {
        const val NAME = "ZcashFfiModule"

        private const val ZCASH_OK = 0

        private const val CODE_UNAVAILABLE = "ZCASH_FFI_UNAVAILABLE"
        private const val MESSAGE_UNAVAILABLE = "The Zcash native library is not loaded"

        /**
         * Loaded on first use, never at startup -- see the class doc.
         *
         * `false` means this build carries no engine (see
         * `scripts/sync-zcash-ffi.sh`), or that `JNI_OnLoad` refused to
         * register its methods, which is indistinguishable from the caller's
         * point of view and handled the same way.
         */
        private val libraryLoaded: Boolean by lazy {
            try {
                System.loadLibrary("zcash_ffi_mobile")
                true
            } catch (error: UnsatisfiedLinkError) {
                false
            }
        }

        /**
         * Maps an engine status to the rejection code the JS layer switches on.
         *
         * Mirrors the `ZCASH_*` constants in `zcash_ffi_mobile.h`, which is the
         * source of truth. Spelled out rather than derived, so a status added
         * there later surfaces as `ZCASH_FFI_UNKNOWN` instead of a silently
         * wrong label.
         */
        private fun errorCode(status: Int): String =
            when (status) {
                -1 -> "ZCASH_FFI_NULL_ARG"
                -2 -> "ZCASH_FFI_INVALID_UTF8"
                -3 -> "ZCASH_FFI_CRYPTO"
                -4 -> "ZCASH_FFI_PANIC"
                -5 -> "ZCASH_FFI_INTERIOR_NUL"
                else -> "ZCASH_FFI_UNKNOWN"
            }
    }
}
