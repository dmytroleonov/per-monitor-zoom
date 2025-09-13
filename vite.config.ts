import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";

function generateManifest() {
  const manifest = readJsonFile("manifest.json");
  const pkg = readJsonFile("package.json");

  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  };
}

export default defineConfig({
  plugins: [
    solid(),
    webExtension({
      manifest: generateManifest,
    }),
  ],
});
