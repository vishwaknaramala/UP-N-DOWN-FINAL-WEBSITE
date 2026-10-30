/**
 * Tactile physical vibration utility using the Web Vibration API (navigator.vibrate).
 * Provides discrete, luxury haptic signatures for mobile interactions.
 */

function canVibrate(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Ultra-light physical tap (12ms) for general button clicks, tabs, and toggles.
 */
export function vibrateTap(): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(12);
  } catch (err) {
    // Non-fatal
  }
}

/**
 * Medium tactile double-pulse when a modal or drawer opens.
 */
export function vibrateModalOpen(): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate([18, 35, 18]);
  } catch (err) {
    // Non-fatal
  }
}

/**
 * Celebratory multi-pulse haptic pattern when VIP Early Access pass is generated.
 */
export function vibrateSuccess(): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate([30, 50, 40, 50, 60]);
  } catch (err) {
    // Non-fatal
  }
}

/**
 * Affirmative double-beat haptic when voting in the drop prediction poll.
 */
export function vibrateVote(): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate([22, 35, 22]);
  } catch (err) {
    // Non-fatal
  }
}

/**
 * Cautionary haptic pulse when clearing local credentials or removing passes.
 */
export function vibrateWarning(): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate([45, 30, 45]);
  } catch (err) {
    // Non-fatal
  }
}
