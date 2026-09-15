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
 * per-ABI `.so` fetched by `scripts/sync-zcash-ffi.sh`, reached through the JNI
 * shim in `src/main/cpp` (Kotlin cannot call a C ABI directly).
 *
 * Register this module only when [isLibraryAvailable] is true: a build without
 * the artifacts has no library to load, and the JS layer is written to treat an
 * absent module as "engine unavailable".
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
            // The C ABI reports a status alongside the string, and JNI has no
            // out parameters -- hence the one-element array (see
            // src/main/cpp/zcash_ffi_jni.cpp).
            val status = IntArray(1)

            val value =
                try {
                    nativeDeriveOrchardAddress(ufvk, status)
                } catch (error: UnsatisfiedLinkError) {
                    // The library vanished between registration and this call.
                    promise.reject(CODE_UNAVAILABLE, "The Zcash native library is not loaded")
                    return@launch
                }

            when {
                value == null ->
                    // ZCASH_ERR_NULL_ARG, which a non-null Kotlin String cannot cause.
                    promise.reject(errorCode(status[0]), "Zcash FFI rejected a null argument")
                status[0] == ZCASH_OK -> promise.resolve(value)
                // On a failure the string carries the message, not an address.
                else -> promise.reject(errorCode(status[0]), value)
            }
        }
    }

    private external fun nativeDeriveOrchardAddress(ufvk: String, outStatus: IntArray): String?

    companion object {
        const val NAME = "ZcashFfiModule"

        private const val ZCASH_OK = 0

        private const val CODE_UNAVAILABLE = "ZCASH_FFI_UNAVAILABLE"

        /**
         * Loaded once per process. `false` means the build carries no engine --
         * see `scripts/sync-zcash-ffi.sh`.
         */
        private val libraryLoaded: Boolean by lazy {
            try {
                System.loadLibrary("zcash_ffi_jni")
                true
            } catch (error: UnsatisfiedLinkError) {
                false
            }
        }

        /** Whether this build can serve derivation at all. */
        fun isLibraryAvailable(): Boolean = libraryLoaded

        /**
         * Maps a C-ABI status to the rejection code the JS layer switches on.
         *
         * Mirrors the `ZCASH_*` constants in `zcash_ffi_mobile.h`, which is the
         * source of truth. Spelled out rather than derived, so a status the
         * header adds later surfaces as `ZCASH_FFI_UNKNOWN` instead of a
         * silently wrong label.
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
