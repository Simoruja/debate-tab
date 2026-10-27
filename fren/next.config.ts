import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // FREN lives in a subfolder of a repo that has its own lockfile;
  // pin the root so Turbopack doesn't climb into the parent app.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
