import { GarmentItem } from '../types';
import { getStoredProducts } from './developerStorage';

export const UPNDOWN_VOTES_UPDATED = 'upndown_product_votes_updated';
const VOTES_STORAGE_KEY = 'upndown_product_votes_ledger_v3';
const USER_VOTE_KEY = 'upndown_user_voted_product_id_v3';

export const DEFAULT_VOTES: Record<string, number> = {
  'upndown-denim-01': 512,
  'upndown-tee-01': 468,
  'upndown-cap-07': 384,
  'upndown-tee-02': 295,
};

export function getStoredVotes(): Record<string, number> {
  if (typeof window === 'undefined') return { ...DEFAULT_VOTES };
  try {
    const raw = localStorage.getItem(VOTES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_VOTES };
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null
      ? { ...DEFAULT_VOTES, ...parsed }
      : { ...DEFAULT_VOTES };
  } catch (e) {
    return { ...DEFAULT_VOTES };
  }
}

export function saveStoredVotes(votes: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votes));
    window.dispatchEvent(new CustomEvent(UPNDOWN_VOTES_UPDATED, { detail: votes }));
  } catch (e) {
    console.error('Failed to save votes locally', e);
  }
}

export function getUserVotedProductId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(USER_VOTE_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function saveUserVotedProductId(productId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (productId) {
      localStorage.setItem(USER_VOTE_KEY, productId);
    } else {
      localStorage.removeItem(USER_VOTE_KEY);
    }
    window.dispatchEvent(new CustomEvent(UPNDOWN_VOTES_UPDATED));
  } catch (e) {}
}

/**
 * Casts a vote for a product, adjusting previous vote if user is switching
 */
export async function castProductVote(productId: string): Promise<Record<string, number>> {
  const currentVotes = getStoredVotes();
  const previousVoteId = getUserVotedProductId();

  const nextVotes = { ...currentVotes };

  // If user previously voted for a different piece, decrement old one
  if (previousVoteId && previousVoteId !== productId && (nextVotes[previousVoteId] || 0) > 0) {
    nextVotes[previousVoteId] = Math.max(0, (nextVotes[previousVoteId] || 1) - 1);
  }

  // Increment selected piece
  nextVotes[productId] = (nextVotes[productId] || 0) + 1;

  // Persist locally
  saveStoredVotes(nextVotes);
  saveUserVotedProductId(productId);

  // Sync to backend API
  try {
    fetch('/api/product-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, previousProductId: previousVoteId }),
    }).catch(() => {});
  } catch (e) {}

  return nextVotes;
}

/**
 * Fetch authoritative votes from server
 */
export async function syncVotesWithServer(): Promise<Record<string, number>> {
  try {
    const res = await fetch('/api/product-votes');
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.votes === 'object') {
        const merged = { ...getStoredVotes(), ...data.votes };
        saveStoredVotes(merged);
        return merged;
      }
    }
  } catch (e) {}
  return getStoredVotes();
}

export interface ProductVoteStats {
  productId: string;
  votes: number;
  percentage: number;
  rank: number;
  isLeader: boolean;
  totalVotes: number;
}

export function getProductVoteStats(
  productId: string,
  products: GarmentItem[],
  votes: Record<string, number>
): ProductVoteStats {
  const totalVotes = products.reduce((sum, p) => sum + (votes[p.id] || 0), 0) || 1;
  const productVotesCount = votes[productId] || 0;
  const percentage = Math.round((productVotesCount / totalVotes) * 100);

  // Calculate rank
  const sorted = [...products].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));
  const rank = Math.max(1, sorted.findIndex((p) => p.id === productId) + 1);
  const isLeader = rank === 1 && productVotesCount > 0;

  return {
    productId,
    votes: productVotesCount,
    percentage,
    rank,
    isLeader,
    totalVotes,
  };
}
