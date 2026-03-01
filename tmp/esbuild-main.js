const esbuild = require('esbuild');
const path = require('path');

const aliasPlugin = {
  name: 'alias',
  setup(build) {
    build.onResolve({ filter: /^@\/.+/ }, args => {
      const rel = args.path.replace(/^@\//, 'src/');
      const abs = path.join(process.cwd(), rel);
      return { path: abs };
    });
  }
};

esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outdir: 'tmp/esbuild-main',
  platform: 'browser',
  sourcemap: false,
  loader: { '.png': 'file', '.svg': 'file' },
  plugins: [aliasPlugin],
  logLevel: 'info',
}).then(() => {
  console.log('esbuild: build completed successfully');
}).catch((err) => {
  console.error('esbuild: build failed');
  console.error(err);
  process.exit(1);
});
