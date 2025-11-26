import express, { type Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configure EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed database on startup (non-blocking - don't fail if DB connection fails)
  try {
    const { seedDatabase } = await import("./seed");
    await seedDatabase();
  } catch (error) {
    console.error("Warning: Database seeding failed, but server will continue:", error);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Default to 5001 to avoid conflicts with macOS ControlCenter on port 5000
  // this serves both the API and the client.
  const defaultPort = 5001;
  const requestedPort = parseInt(process.env.PORT || String(defaultPort), 10);

  const useUnixSocket = process.env.USE_UNIX_SOCKET === "true";
  const socketPath = process.env.SOCKET_PATH || "/tmp/agency.sock";

  if (useUnixSocket) {
    // Remove existing socket file if present
    try {
      if (fs.existsSync(socketPath)) {
        fs.unlinkSync(socketPath);
      }
    } catch (err) {
      log(`warning: could not remove existing socket file ${socketPath}: ${String(err)}`);
    }

    server.listen(socketPath, () => {
      try {
        // make socket world-writable so tools can connect if needed
        fs.chmodSync(socketPath, 0o766);
      } catch (err) {
        // ignore chmod errors
      }
      log(`serving on unix socket ${socketPath}`);
    });
  } else {
    // Function to try listening on a port, with automatic fallback
    const tryListen = (port: number, maxAttempts = 10): void => {
      const listenOpts: any = {
        port,
        // bind to localhost for local development to avoid environment socket restrictions
        host: "127.0.0.1",
      };
      if (process.env.USE_REUSEPORT === "true") {
        listenOpts.reusePort = true;
      }

      server.listen(listenOpts, () => {
        log(`✅ Server running on http://127.0.0.1:${port}`);
      }).on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          const nextPort = port + 1;
          if (nextPort <= port + maxAttempts) {
            log(`⚠️  Port ${port} is in use, trying port ${nextPort}...`);
            tryListen(nextPort, maxAttempts - 1);
          } else {
            log(`❌ Could not find an available port after ${maxAttempts} attempts`);
            process.exit(1);
          }
        } else {
          log(`❌ Server error: ${err.message}`);
          throw err;
        }
      });
    };

    tryListen(requestedPort);
  }
})();
