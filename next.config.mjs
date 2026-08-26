/** @type {import("next").NextConfig} */

const nextConfig = {
  experimental: {},
  async redirects() {
    return [
      { source: "/topic832", destination: "/areas/topic-832", permanent: true },
      { source: "/asc815", destination: "/areas/asc-815", permanent: true },
      { source: "/restatements", destination: "/areas/restatements", permanent: true },
    ];
  },
};

export default nextConfig;
