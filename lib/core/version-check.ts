/**
 * Check if QR Code version is valid
 */
export function isValid(version: number): boolean {
  return !isNaN(version) && version >= 1 && version <= 40;
}
