/**
 * Format a number as Kenyan Shillings (KSh)
 */
export function formatKSh(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1000) {
    return `KSh ${(amount / 1000).toFixed(1)}k`;
  }
  return `KSh ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatKShInt(amount: number): string {
  return `KSh ${amount.toLocaleString()}`;
}
