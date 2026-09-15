// JNI shim over the Zcash engine's C ABI.
//
// The prebuilt library (libzcash_ffi_mobile.so, from the `zcash-ffi-mobile`
// crate in LedgerHQ/ledger-zcash-utils) exports plain C, which Kotlin cannot
// call directly -- Android has no FFI of its own. This file is the whole
// bridge: it translates JNI calling conventions to that C ABI and back, and
// owns nothing else.
//
// The C contract (see zcash_ffi_mobile.h): every call returns a status and
// writes a heap-allocated string to `*out` that the caller must free -- the
// result on success, the error message otherwise. JNI has no out parameters,
// so the status travels back through a one-element int array supplied by the
// caller and the string is the return value.

#include <jni.h>

#include "zcash_ffi_mobile.h"

extern "C" JNIEXPORT jstring JNICALL
Java_com_ledger_live_ZcashFfiModule_nativeDeriveOrchardAddress(
    JNIEnv *env,
    jobject /* thiz */,
    jstring ufvk,
    jintArray out_status) {
  const char *ufvk_utf8 = env->GetStringUTFChars(ufvk, nullptr);
  if (ufvk_utf8 == nullptr) {
    // An OutOfMemoryError is already pending; the return value is ignored.
    return nullptr;
  }

  char *out = nullptr;
  const jint status = zcash_orchard_address_from_ufvk(ufvk_utf8, &out);

  // Released as early as possible: the key material has no reason to stay
  // mapped past the call.
  env->ReleaseStringUTFChars(ufvk, ufvk_utf8);

  env->SetIntArrayRegion(out_status, 0, 1, &status);

  if (out == nullptr) {
    // ZCASH_ERR_NULL_ARG only, which a non-null Kotlin String cannot cause.
    return nullptr;
  }

  jstring result = env->NewStringUTF(out);
  zcash_string_free(out);
  return result;
}
