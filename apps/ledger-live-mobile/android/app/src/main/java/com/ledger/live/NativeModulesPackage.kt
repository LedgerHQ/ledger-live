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

        // Registered unconditionally, and deliberately so: the previous
        // availability probe called System.loadLibrary during bridge
        // initialisation on every launch, whether or not anything Zcash was
        // used. Instantiating the module is free; the library loads on the
        // first actual call, and a build without the engine rejects with
        // ZCASH_FFI_UNAVAILABLE, which the JS layer already handles.
        add(ZcashFfiModule(reactContext))
    }.toMutableList()
}