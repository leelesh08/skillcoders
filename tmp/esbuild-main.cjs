const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const tryResolve = (absPath) => {
  const exts = ['.tsx', '.ts', '.jsx', '.js'];
  // direct file
  for (const e of exts) {
    if (fs.existsSync(absPath + e)) return absPath + e;
  }
  // as-is
  if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) return absPath;
  // index files in directory
  for (const e of exts) {
    const idx = path.join(absPath, 'index' + e);
    if (fs.existsSync(idx)) return idx;
  }
  return null;
};

const aliasPlugin = {
  name: 'alias',
  setup(build) {
    build.onResolve({ filter: /^@\/.+/ }, args => {
      const rel = args.path.replace(/^@\//, 'src/');
      const absBase = path.join(process.cwd(), rel);
      const resolved = tryResolve(absBase);
      if (resolved) return { path: resolved };
      // fallback: return absBase and let esbuild try
      return { path: absBase };
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
