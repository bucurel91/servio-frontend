import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};
const apiKey: string = extra.firebaseApiKey ?? "";

// Whether Firebase is actually configured (env vars filled in)
export const isFirebaseConfigured = apiKey.length > 0;

// Only initialize Firebase if the config is present.
// This allows running the app locally without a Firebase project.
const _app = isFirebaseConfigured
  ? getApps().length === 0
    ? initializeApp({
        apiKey,
        authDomain: extra.firebaseAuthDomain ?? "",
        projectId: extra.firebaseProjectId ?? "",
        storageBucket: extra.firebaseStorageBucket ?? "",
        messagingSenderId: extra.firebaseMessagingSenderId ?? "",
        appId: extra.firebaseAppId ?? "",
      })
    : getApps()[0]
  : null;

export const firebaseAuth = _app
  ? (() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getReactNativePersistence } = require("firebase/auth");
        return initializeAuth(_app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch {
        return getAuth(_app);
      }
    })()
  : null;
