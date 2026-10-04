package com.englishjourney.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.englishjourney.app.tts.NativeTtsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeTtsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
