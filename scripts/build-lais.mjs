import { build } from "esbuild";
await build({
  entryPoints: ["src/lais.js"],
  bundle: true,
  splitting: true,
  format: "esm",
  outdir: "dist/lais",
  minify: true,
  target: ["es2022"],
  legalComments: "eof",
  chunkNames: "chunks/[name]-[hash]",
});
console.log("Laís client built; SDK loads only on a visitor's explicit start.");
