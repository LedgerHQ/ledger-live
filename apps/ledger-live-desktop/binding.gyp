{
  "targets": [
    {
      "target_name": "webauthn_module",
      "sources": [
        "./native-new/WebAuthnModule/src/webauthn_binding.cc",
        "./native-new/WebAuthnModule/Sources/WebAuthnModule/Authenticator.swift"
      ],
       "cflags_cc": ["-std=c++17", "-fexceptions", "-DNAPI_CPP_EXCEPTIONS"],
       "include_dirs": [
        "<!(node -p \"require('path').resolve(__dirname, './node_modules/node-addon-api')\")"
      ],
       "xcode_settings": {
         "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "OTHER_LDFLAGS": [
          "-framework", "AuthenticationServices",
          "-lc++"
        ],
        "SWIFT_VERSION": "5.0",
        "GCC_PREPROCESSOR_DEFINITIONS": [
          "NAPI_CPP_EXCEPTIONS"
        ]
      },

      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "SWIFT_OBJC_BRIDGING_HEADER": "./native-new/WebAuthnModule/src/webauthn_module-Bridging-Header.h",
            "SWIFT_OBJC_INTERFACE_HEADER_NAME": "webauthn_module-Swift.h",
            "MACOSX_DEPLOYMENT_TARGET": "10.15"
          }
        }]
      ]
    }
  ]
}