// Replace esbuild config to inject __dirname as a global variable
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  outfile: './dist/index.js',
  minify: false,
  sourcemap: true,
  platform: 'node',
  target: ['node14'],
  banner: { js: `const __dirname = require('path').dirname(require.resolve('./index.cjs'));` },
  // other options...
  plugins: [],
}).catch(() => process.exit(1));