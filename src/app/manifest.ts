import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tabroom",
    short_name: "Tabroom",
    description: "Debate tournament management",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#1c2233",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
