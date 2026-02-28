/**
 * Admin secret = (total vowel count in user's full name) * 26
 * Vowels: a, e, i, o, u (case-insensitive)
 * Examples: 1 vowel → 26, 2 vowels → 52, 3 vowels → 78
 */

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])

/**
 * Counts total number of vowels (a, e, i, o, u) in the given name.
 * Case-insensitive. Only letters are considered.
 */
export function countVowelsInName(name: string): number {
  if (!name || typeof name !== 'string') return 0
  const lower = name.toLowerCase().trim()
  let count = 0
  for (let i = 0; i < lower.length; i++) {
    if (VOWELS.has(lower[i])) count++
  }
  return count
}

/**
 * Returns the admin secret for the given display name.
 * Formula: vowelCount * 26
 */
export function getAdminSecretFromName(displayName: string): number {
  const vowelCount = countVowelsInName(displayName)
  return vowelCount * 26
}

/**
 * Validates that the entered secret matches the expected value
 * for the given user display name.
 */
export function validateAdminSecret(displayName: string, enteredSecret: number): boolean {
  const expected = getAdminSecretFromName(displayName)
  return Number(enteredSecret) === expected
}
