export interface JwtPayload {
  sub: string;
  /** Yönetici access token */
  role?: string;
  /** Access token’larda dolu; refresh token’da olmayabilir */
  orgId?: string;
  /** `"portal"` veya `"portal_refresh"` veya `"refresh"` */
  type?: string;
}
