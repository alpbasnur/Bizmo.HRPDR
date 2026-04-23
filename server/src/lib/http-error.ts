/** İstemci hataları için HTTP durumu taşıyan hata (500 yerine 4xx) */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function isHttpError(e: unknown): e is HttpError {
  return e instanceof HttpError;
}
