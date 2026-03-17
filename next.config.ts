import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure that these server-only node packages aren't bundled by Webpack/Turbopack
  serverExternalPackages: [
    'fluent-ffmpeg',
    '@ffmpeg-installer/ffmpeg',
    '@ffprobe-installer/ffprobe'
  ],
};

export default nextConfig;
