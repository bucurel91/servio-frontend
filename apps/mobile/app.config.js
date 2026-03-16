const { config: loadDotenv } = require("dotenv");
const path = require("path");

// Load .env.local before Expo reads the config
loadDotenv({ path: path.resolve(__dirname, ".env.local"), override: true });

// Read app.json as the base config
const appJson = require("./app.json");

module.exports = {
  ...appJson.expo,
  extra: {
    eas: { projectId: "7cfd123f-6994-4298-b260-2437e3d5eceb" },
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080",
  },
};
