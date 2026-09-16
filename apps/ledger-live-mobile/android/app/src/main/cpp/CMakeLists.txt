# Builds the JNI shim that lets Kotlin reach the prebuilt Zcash engine.
#
# Both the engine (libzcash_ffi_mobile.so, per ABI) and its header are fetched
# by scripts/sync-zcash-ffi.sh, not committed. On a checkout without them this
# file deliberately declares no target: nothing is built, System.loadLibrary
# fails, and the native module is never registered -- so an Android build stays
# green without the Rust artifacts.

cmake_minimum_required(VERSION 3.22.1)
project(zcash_ffi_jni)

set(ZCASH_PREBUILT "${CMAKE_CURRENT_SOURCE_DIR}/../jniLibs/${ANDROID_ABI}/libzcash_ffi_mobile.so")
set(ZCASH_HEADER_DIR "${CMAKE_CURRENT_SOURCE_DIR}/include")

if(EXISTS "${ZCASH_PREBUILT}" AND EXISTS "${ZCASH_HEADER_DIR}/zcash_ffi_mobile.h")
  add_library(zcash_ffi_mobile SHARED IMPORTED)
  set_target_properties(zcash_ffi_mobile PROPERTIES IMPORTED_LOCATION "${ZCASH_PREBUILT}")

  add_library(zcash_ffi_jni SHARED zcash_ffi_jni.cpp)
  target_include_directories(zcash_ffi_jni PRIVATE "${ZCASH_HEADER_DIR}")

  # The engine is packaged from jniLibs by Gradle; linking it here only records
  # the DT_NEEDED entry that makes System.loadLibrary pull it in.
  target_link_libraries(zcash_ffi_jni zcash_ffi_mobile)
else()
  message(
    WARNING
    "Zcash engine not found for ${ANDROID_ABI}; skipping the JNI shim. "
    "Run scripts/sync-zcash-ffi.sh to fetch it."
  )
endif()
