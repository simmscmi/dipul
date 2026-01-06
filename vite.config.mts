import { defineConfig, loadEnv } from "vite";
import { fileURLToPath, URL } from "url";
import VuePlugin from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    return {
        manifest: true,
        base: env.FRONTEND_BASE || "./",
        build: {
            outDir: "../dist",
            emptyOutDir: true,
        },
        root: "./src",
        envDir: "../",
        plugins: [
            VuePlugin(),
        ],
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
            },
        },
        server: {
            port: 3000,
            https: env.DEV_SERVER_CERT
                ? {
                    cert: env.DEV_SERVER_CERT,
                    key: env.DEV_SERVER_KEY,
                }
                : undefined,
            hmr: {
                host: "localhost",
            },
            headers: {
                "Access-Control-Allow-Private-Network": "true",
            },
            proxy: JSON.parse(env.DEV_SERVER_PROXY_JSON || "{}") || {},
        },
    };
});
