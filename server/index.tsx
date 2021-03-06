import Koa from 'koa';
import serve from 'koa-static';
import { h } from 'preact';
import renderToString from 'preact-render-to-string';
import { setPragma } from 'goober';
import App from '../src/App';
import { setupStylesCollector } from '../src/styles/styles-collector';

setPragma(h);

/**
 * Injected by webpack.DefinePlugin
 */
declare const ASSETS_MANIFEST_PATH: string;
declare const STATIC_ASSETS_PATH: string;

const app = new Koa();
const webpackManifest = require(ASSETS_MANIFEST_PATH);
const mainJs = webpackManifest.main.js;

app.use(
  serve(STATIC_ASSETS_PATH, {
    index: 'NO_INDEX_FILE_ALLOWED.html',
  }),
); // serve the static assets generated by snowpack build

app.use(async (ctx) => {
  const style = { data: '' };

  // Setup the current request with a styles collector
  setupStylesCollector(style);

  const markup = renderToString(<App name="SSR" />);

  // simulate asynchronous rendering, for example, maybe we are using react-apollo `renderToStringWithData()`
  // Because goober use a single "sheet" for SSR, this will not work properly.
  // Only the first finished request will get the style from extractCss();
  await (async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });
  })();

  console.log({ style });

  ctx.body = `
    <html>
    <head>
      <meta charset="utf-8" />
      <link rel="icon" href="/favicon.ico" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content="Web site created using create-snowpack-app" />
      <title>SSR - Snowpack preact</title>
      <style>${style.data}</style>
    </head>
    <body>
      <div id="root">${markup}</div>
      <script defer src="${mainJs}"></script>
    </body>
    </html>
  `;
});

app.listen(8001, () => {
  console.log('Koa server listening on port 8001');
});
