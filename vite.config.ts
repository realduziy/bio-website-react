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

                  // Default hashes correspond to username: duziydev / password: EAJBN)(*&UDF
                  let expectedUserHash = (
                    process.env.ADMIN_USERNAME_HASH || ""
                  ).trim();
                  let expectedPassHash = (
                    process.env.ADMIN_PASSWORD_HASH || ""
                  ).trim();

                  if (!expectedUserHash || expectedUserHash.length !== 64) {
                    expectedUserHash =
                      "01d370f6ec03e7742d5c5fccc6e5529d27ccf4eb207ba308fe327e61049baf11";
                  }
                  if (!expectedPassHash || expectedPassHash.length !== 64) {
                    expectedPassHash =
                      "898deff28174fa0f9fa08cae92166d40e1c10f54c554f05d9ae6ff31fd0dd07d";
                  }

                  const inputUserHash = sha256(normUsername);
                  const inputPassHash = sha256(normPassword);

                  let matches = false;
                  try {
                    const uMatch = crypto.timingSafeEqual(
                      Buffer.from(inputUserHash),
                      Buffer.from(expectedUserHash),
                    );
                    const pMatch = crypto.timingSafeEqual(
                      Buffer.from(inputPassHash),
                      Buffer.from(expectedPassHash),
                    );
                    matches = uMatch && pMatch;
                  } catch {
                    matches =
                      inputUserHash === expectedUserHash &&
                      inputPassHash === expectedPassHash;
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
    },
    define: {
      __ADMIN_USERNAME_HASH__: JSON.stringify(
        process.env.ADMIN_USERNAME_HASH || "",
      ),
      __ADMIN_PASSWORD_HASH__: JSON.stringify(
        process.env.ADMIN_PASSWORD_HASH || "",
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});