/**
 * Prefix a public asset path with the configured base path.
 * Required because plain `<img>` tags don't get Next.js's automatic
 * basePath rewriting like `next/image` or `next/link` do.
 */
export function getAssetPath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  // Ensure path starts with a slash and doesn't double-slash with basePath
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}
