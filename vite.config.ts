import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import path from "path";
import fs from "fs";


export default defineConfig(() => {
  const devFile = path.resolve(__dirname, "./src/environments_dev.ts");
  const prodFile = path.resolve(__dirname, "./src/environments_prod.ts");

  const fileToUse = fs.existsSync(devFile) ? devFile : prodFile;

  return {
	base: `web-voice-demo`,
	plugins: [solid()],
	build: {
		target: "esnext",
	},
    resolve: {
      alias: {
        "@environments": fileToUse
      }
    }
  };
});
