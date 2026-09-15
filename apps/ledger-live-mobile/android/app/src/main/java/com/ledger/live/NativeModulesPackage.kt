package com.ledger.live

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import com.ledger.live.fabric.MeasureTransformModule
import kotlinx.coroutines.Dispatchers

class NativeModulesPackage : ReactPackage {

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): MutableList<ViewManager<View, ReactShadowNode<*>>> = mutableListOf()

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): MutableList<NativeModule> = buildList {
        add(BluetoothHelperModule(reactContext))
        add(LocationHelperModule(reactContext, coroutineDispatcher = Dispatchers.Default))
        add(MeasureTransformModule(reactContext))

        // Registered only when the build carries the prebuilt Zcash engine
        // (scripts/sync-zcash-ffi.sh). Leaving the module out is the signal the
        // JS layer reads as "engine unavailable" -- registering one that always
        // fails would turn that clear answer into a runtime error.
        if (ZcashFfiModule.isLibraryAvailable()) {
            add(ZcashFfiModule(reactContext))
        }
    }.toMutableList()
}