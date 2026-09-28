import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages sirve la app como estática desde `out/`: es una sola
  // página que corre en el navegador y habla con el backend de Django.
  output: "export",
};

export default nextConfig;
