/** Wishlist persistence, so saved products survive a reload or a return visit. */
import { productById } from '../data/products';

const STORAGE_KEY = 'meridian.wishlist';

/** Reads saved product ids, dropping anything no longer in the catalog. */
export function loadWishlist(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const ids = parsed.filter((id): id is string => typeof id === 'string' && productById(id) !== undefined);
    return [...new Set(ids)];
  } catch {
    // Storage unavailable (private mode, blocked cookies) or corrupt: start empty.
    return [];
  }
}

export function saveWishlist(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage full or unavailable; the wishlist still works for this visit.
  }
}

export function toggleSaved(ids: string[], productId: string): string[] {
  return ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId];
}
