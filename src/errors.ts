export interface GenericError extends Error {
  code?: string
  description?: string
}

export class GenericError extends Error {
  constructor(message: string, code?: string, description?: string) {
    super(message)
    this.code = code
    this.description = description
  }
}

export class NotFoundError extends GenericError {
  constructor() { super('not found', 'ERR_NOT_FOUND') }
}
