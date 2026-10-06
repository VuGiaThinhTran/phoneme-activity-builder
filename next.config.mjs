/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't advertise the framework in an "X-Powered-By: Next.js" header.
  poweredByHeader: false,

  // A few response headers that are safe to set everywhere:
  //  - nosniff: the browser must trust the declared Content-Type, so a response
  //    can't be re-interpreted as script;
  //  - X-Frame-Options: other sites can't embed our pages in a frame (clickjacking);
  //  - Referrer-Policy: don't leak full URLs to other sites.
  // A Content-Security-Policy is deliberately NOT set: Next.js and our theme
  // script use inline scripts, so a correct policy needs per-request nonces —
  // a follow-up, not something to bolt on blindly.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
