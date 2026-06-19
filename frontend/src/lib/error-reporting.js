export function reportAppError(error, context = {}) {
  console.error("App Error:", error, context);
  // You can integrate your own error reporting service here (e.g. Sentry, LogRocket)
}
