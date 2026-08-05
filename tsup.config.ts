import {defineConfig} from 'tsup'

/**
 * Two entries, two configs, because only one of them is a program.
 *
 * `banner` is fixed for a whole build, so a single config carrying both entries
 * would put `#!/usr/bin/env node` at the top of the library as well. Splitting
 * them keeps the shebang on the thing that is executed and the declarations on
 * the thing that is imported.
 *
 * `clean` runs per config, so it belongs only to the first — on the second it
 * would delete the cli bundle the first just wrote.
 *
 * Declarations are emitted by `tsc -p tsconfig.build.json` rather than tsup's
 * `dts` option: that option runs a `rollup-plugin-dts` built against TypeScript
 * 5, and this project is on 7, which crashes it. `tsc` is the compiler the
 * `typecheck` script already trusts and has no second copy to disagree with.
 */
export default defineConfig([
  {
    entry: ['src/cli.tsx'],
    format: 'esm',
    target: 'node18',
    clean: true,
    banner: {js: '#!/usr/bin/env node'},
  },
  {
    entry: ['src/index.ts'],
    format: 'esm',
    target: 'node18',
  },
])
