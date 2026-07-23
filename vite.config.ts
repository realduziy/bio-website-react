import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import crypto from "crypto";

// Helper to hash string with SHA-256
function sha256(val: string): string {
  return crypto.createHash("sha256").update(val).digest("hex");
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "api-admin-auth-dev",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === "/api/admin/auth" && req.method === "POST") {
              let body = "";
              req.on("data", (chunk) => {
                body += chunk;
              });
              req.on("end", () => {
                try {
                  const data = JSON.parse(body);
                  const { username, password } = data;

                  if (
                    typeof username !== "string" ||
                    typeof password !== "string"
                  ) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    return res.end(
                      JSON.stringify({
                        authenticated: false,
                        error: "Invalid credentials format",
                      }),
                    );
                  }

                  const normUsername = username.trim().toLowerCase();
                  const normPassword = password.trim();

                  const expectedUserRawOrHash = (
                    process.env.ADMIN_USERNAME_HASH || ""
                  ).trim();
                  const expectedPassRawOrHash = (
                    process.env.ADMIN_PASSWORD_HASH || ""
                  ).trim();

                  if (!expectedUserRawOrHash || !expectedPassRawOrHash) {
                    res.writeHead(401, { "Content-Type": "application/json" });
                    return res.end(
                      JSON.stringify({
                        authenticated: false,
                        error: "Administrative access variables are not configured in your environmental variables (.env). Please set ADMIN_USERNAME_HASH and ADMIN_PASSWORD_HASH.",
                      }),
                    );
                  }

                  // Check 1: Support direct plain-text credential matching
                  let matches = false;
                  if (normUsername === expectedUserRawOrHash.toLowerCase() && normPassword === expectedPassRawOrHash) {
                    matches = true;
                  } else {
                    // Check 2: Support SHA-256 hash matching
                    const inputUserHash = sha256(normUsername);
                    const inputPassHash = sha256(normPassword);

                    try {
                      const uMatch = crypto.timingSafeEqual(
                        Buffer.from(inputUserHash),
                        Buffer.from(expectedUserRawOrHash),
                      );
                      const pMatch = crypto.timingSafeEqual(
                        Buffer.from(inputPassHash),
                        Buffer.from(expectedPassRawOrHash),
                      );
                      matches = uMatch && pMatch;
                    } catch {
                      matches =
                        inputUserHash === expectedUserRawOrHash &&
                        inputPassHash === expectedPassRawOrHash;
                    }
                  }

                  if (matches) {
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ authenticated: true }));
                  } else {
                    res.writeHead(401, { "Content-Type": "application/json" });
                    res.end(
                      JSON.stringify({
                        authenticated: false,
                        error:
                          "Unauthorized Administrative access token or passcode mismatch",
                      }),
                    );
                  }
                } catch (e) {
                  res.writeHead(400, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      authenticated: false,
                      error: "Invalid JSON body payload",
                    }),
                  );
                }
              });
            } else {
              next();
            }
          });
        },
      },
    ],
    build: {
      assetsDir: "build_assets",
      rollupOptions: {
        external: (id) =>
          id.endsWith(".node") ||
          id.includes("@tailwindcss/oxide") ||
          id.includes("tailwindcss-oxide"),
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("scheduler")) {
                return "vendor-react";
              }
              if (id.includes("motion")) {
                return "vendor-motion";
              }
              if (id.includes("lucide-react")) {
                return "vendor-lucide";
              }
              return "vendor";
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
