import { defineConfig } from "vite"
import path from "path"

export default defineConfig({
    build: {
        // minify: false,
        emptyOutDir: true,
        rollupOptions: {
            input:  {
                index: path.resolve(__dirname, 'src/code/code.js'),
            },
            output: {
                manualChunks:   undefined,
                entryFileNames: "code.js",
            },
        },
        outDir: "./dist/src/code",
    },
})
