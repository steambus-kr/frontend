import { join } from "node:path";
import fs from "node:fs/promises";
import { minify as minifyHTML, Options as HTMLOptions } from "html-minifier"
import { transform as minifyCSS } from "lightningcss";
import { minify as minifyJS } from "terser";
import {transpileModule, ScriptTarget, ModuleKind} from "typescript";

const HTMLOptions: HTMLOptions = {
  html5: true,
  minifyCSS: true,
  minifyJS: true,
  collapseWhitespace: true,
  decodeEntities: true,
  processConditionalComments: true,
  removeAttributeQuotes: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeOptionalTags: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
}

const srcPath = join(__dirname, "src");

const srcPages = join(srcPath, "pages");
const srcScripts = join(srcPath, "scripts");
const srcStyles = join(srcPath, "styles");

const distPath = join(__dirname, 'dist');

const distPages = join(distPath, 'pages');
const distScripts = join(distPath, 'scripts');
const distStyles = join(distPath, 'styles');

await fs.rm(distPath, {recursive: true, force: true});

await Promise.all([
  fs.mkdir(distPages, { recursive: true }),
  fs.mkdir(distScripts, { recursive: true }),
  fs.mkdir(distStyles, { recursive: true }),
])

await Promise.all([
  (async () => await Bun.write(join(distPath, "index.html"), minifyHTML(await Bun.file(join(srcPath, "index.html")).text(), HTMLOptions)))(),
  (async () => await Bun.write(join(distPath, "index.css"), minifyCSS({ filename: "index.css", code: Buffer.from(await Bun.file(join(srcPath, "index.css")).text()) as unknown as Uint8Array<ArrayBufferLike>, minify: true }).code))()
]);

const pageFiles = await fs.readdir(srcPages);
await Promise.all(
  pageFiles.map(async (page) => {
    const pagePath = join(srcPages, page);
    await Bun.write(join(distPages, page), minifyHTML(await Bun.file(pagePath).text(), HTMLOptions));
  })
)

const styleFiles = await fs.readdir(srcStyles);
await Promise.all(
  styleFiles.map(async (style) => {
    const stylePath = join(srcStyles, style);
    await Bun.write(join(distStyles, style), minifyCSS({ filename: style, code: Buffer.from(await Bun.file(stylePath).text()) as unknown as Uint8Array<ArrayBufferLike>, minify: true }).code);
  })
)

const scriptFiles = [];
const scriptFilesDirent = await fs.readdir(srcScripts, {withFileTypes: true});
for (const file of scriptFilesDirent) {
  const filePath = join(srcScripts, file.name);
  if (file.isDirectory()) {
    const subFiles = await fs.readdir(filePath, {withFileTypes: true});
    scriptFiles.push(...subFiles.map((subFile) => join(file.name, subFile.name)))
  } else {
    scriptFiles.push(file.name);
  }
}

await Promise.all(
  scriptFiles.map(async (script) => {
    const scriptPath = join(srcScripts, script);
    const fileContent = await Bun.file(scriptPath).text();
    const transpiled = transpileModule(fileContent, {
      compilerOptions: {
        target: ScriptTarget.ES2022,
        module: ModuleKind.ES2022,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        strict: true,
        skipLibCheck: true,
      }
    }).outputText
    await Bun.write(join(distScripts, script.replace(/\.ts$/, ".js")), (await minifyJS(transpiled)).code!)
  })
)