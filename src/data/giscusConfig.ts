/**
 * Giscus comment system configuration.
 *
 * These are public GitHub repository identifiers — not secrets.  They are
 * safe to commit and are kept here (rather than in environment variables) so
 * that the static build can embed them at build time without requiring a
 * runtime environment.
 *
 * To look up IDs for a different repo:
 *   https://giscus.app  →  enter the repo name → copy the generated values.
 */

/** GitHub repository in "owner/name" format. */
export const repo = 'sgn07124/sgn07124.github.io';

/** Numeric repository ID from the GitHub API (R_…). */
export const repoId = 'R_kgDOSxCYqA';

/** Discussion category name used for comments. */
export const category = 'General';

/** Discussion category ID (DIC_…). */
export const categoryId = 'DIC_kwDOSxCYqM4C_ICJ';