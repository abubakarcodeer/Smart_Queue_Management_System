// We use this to capture SSR errors that h3/nitro otherwise swallow
// and then consume them in our custom server entry to render a nice error page.

let lastCapturedError;

function record(error) {
  lastCapturedError = { error, at: Date.now() };
}

const isBrowser = typeof window !== "undefined" && typeof window.addEventListener === "function";

if (isBrowser) {
  window.addEventListener("error", (event) => record(event.error ?? event));
  window.addEventListener("unhandledrejection", (event) => record(event.reason));
}

export function consumeLastCapturedError() {
  if (!lastCapturedError) return undefined;
  // If the error is older than 10 seconds, it's probably not relevant to the current request.
  if (Date.now() - lastCapturedError.at > 10000) return undefined;
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
