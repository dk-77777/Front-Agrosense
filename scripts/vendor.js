import { copyFile, mkdir, readdir } from "node:fs/promises";
await mkdir("assets/vendor/fonts", { recursive: true });
await mkdir("assets/fonts", { recursive: true });
for (const [source, target] of [
  ["node_modules/bootstrap/LICENSE", "assets/vendor/bootstrap-LICENSE"],
  [
    "node_modules/bootstrap-icons/LICENSE",
    "assets/vendor/bootstrap-icons-LICENSE",
  ],
  ["node_modules/@fontsource/manrope/LICENSE", "assets/fonts/Manrope-LICENSE"],
  [
    "node_modules/bootstrap/dist/css/bootstrap.min.css",
    "assets/vendor/bootstrap.min.css",
  ],
  [
    "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js",
    "assets/vendor/bootstrap.bundle.min.js",
  ],
  [
    "node_modules/bootstrap-icons/font/bootstrap-icons.css",
    "assets/vendor/bootstrap-icons.css",
  ],
  [
    "node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2",
    "assets/vendor/fonts/bootstrap-icons.woff2",
  ],
])
  await copyFile(source, target);
for (const name of await readdir("node_modules/@fontsource/manrope/files")) {
  if (/manrope-latin-(400|600|700|800)-normal.woff2$/.test(name))
    await copyFile(
      `node_modules/@fontsource/manrope/files/${name}`,
      `assets/fonts/${name}`,
    );
}
console.log("Bootstrap, ícones e Manrope disponíveis localmente.");
