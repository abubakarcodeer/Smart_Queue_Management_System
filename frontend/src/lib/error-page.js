export function renderErrorPage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Something went wrong</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; color: #000; }
        .content { text-align: center; max-width: 400px; padding: 20px; }
        h1 { font-size: 24px; margin: 0 0 16px; }
        p { font-size: 16px; color: #666; margin: 0 0 24px; }
        a { display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 10px 20px; rounded: 6px; font-weight: 500; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="content">
        <h1>This page didn't load</h1>
        <p>Something went wrong. Try refreshing or head back home.</p>
        <a href="/">Go home</a>
      </div>
    </body>
    </html>
  `;
}
