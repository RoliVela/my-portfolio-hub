const isGithubPages = process.env.GITHUB_PAGES === 'true';
const repoName = 'my-portfolio-hub';
const basePath = isGithubPages ? `/${repoName}` : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [100, 75], // Allow quality 100 to avoid warnings
    unoptimized: isGithubPages, // GitHub Pages serves static files only, no image optimization server
  },
  output: isGithubPages ? 'export' : undefined,
  basePath: basePath || undefined,
  assetPrefix: isGithubPages ? `${basePath}/` : undefined,
  // Exposed to the client so plain <img> tags (which don't get automatic
  // basePath rewriting like next/image or next/link do) can prefix their src.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
