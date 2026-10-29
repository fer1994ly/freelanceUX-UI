/** Business-rule violation carrying a stable machine-readable code. */
export class DomainError extends Error {
  readonly code: string
  constructor(code: string, message?: string) {
    super(message ?? code)
    this.name = 'DomainError'
    this.code = code
  }
}

/** Raised by repositories when an optimistic version check fails. */
export class ConcurrencyError extends Error {
  constructor(message = 'Concurrent modification detected') {
    super(message)
    this.name = 'ConcurrencyError'
  }
}
