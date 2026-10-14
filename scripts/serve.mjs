import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("out");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};
const port = Number(process.argv[2] || 3000);
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      let file = path.resolve(root, "." + pathname);
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      try {
        const info = await stat(file);
        if (info.isDirectory()) file = path.join(file, "index.html");
      } catch {
        if (!path.extname(file)) file += ".html";
      }
      const body = await readFile(file);
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log("Demo ready at http://localhost:" + port),
  );
