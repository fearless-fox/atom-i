/**
 * Service Worker Registration for ATOM-I Standalone PWA
 */

export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[ATOM-I] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[ATOM-I] Service Worker registration failed:", err);
        });
    });
  }
}
