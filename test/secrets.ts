/**
 * Fake secrets for the privacy tests, assembled from pieces at run time so the repository never
 * holds a string that looks like a live key. None of these is real: the card numbers are the
 * standard test numbers, the phone numbers use the 555-01xx range reserved for fiction, and the
 * email domain is example.com, reserved for documentation (RFC 2606).
 */
const join = (...parts: string[]) => parts.join('')
const run = (c: string, n: number) => c.repeat(n)

export const secrets = {
  email: join('someone', '@', 'example.com'),
  phone: join('+1 (615) ', '555-0123'),
  'street-address': join('742 Evergreen ', 'Terrace'),
  'card-number': join('4111 1111 ', '1111 1111'),
  'id-number': join('123-', '45-', '6789'),
  'private-key': join('-----BEGIN ', 'OPENSSH PRIVATE KEY', '-----'),
  'api-key': join('AK', 'IA', run('Q', 16)),
  token: join('gh', 'p_', run('a1B2', 9)),
  'secret-assignment': join('api_', 'key = ', '"', run('z9', 8), '"'),
} as const
