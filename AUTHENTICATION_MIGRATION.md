# Authentication Migration Guide

## Overview

The ODAI API authentication has been simplified from OAuth2 client credentials to a simple access code flow. This document outlines the changes made to the codebase.

## What Changed

### Removed
- ❌ Anonymous sessions
- ❌ Client credentials (OAuth2) flow
- ❌ Token refresh endpoints
- ❌ Token introspection
- ❌ `ODAI_CLIENT_ID` and `ODAI_CLIENT_SECRET` environment variables

### Added
- ✅ Access code authentication
- ✅ Session token management (60 min validity, 50 requests)
- ✅ Frontend authentication UI
- ✅ Session storage in browser
- ✅ Automatic re-authentication on 401 errors

## New Authentication Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Enters access code (e.g., "DEMO2025")
       ▼
┌─────────────────────────────────────┐
│  POST /api/auth/access              │
│  { access_code: "DEMO2025" }        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Receive Session Token              │
│  - session_token                    │
│  - expires_at (60 min)              │
│  - quota_remaining (50 requests)    │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Store in sessionStorage            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Use in Authorization header        │
│  Authorization: Bearer <token>      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  401 Error? → Prompt for new code   │
└─────────────────────────────────────┘
```

## API Endpoints

| Endpoint             | Method | Purpose                            |
|----------------------|--------|------------------------------------|
| `/api/auth/access`   | POST   | Get session token with access code |
| `/api/auth/status`   | GET    | Check remaining quota/expiry       |
| `/api/auth/revoke`   | POST   | Logout (revoke session token)      |
| `/api/chat`          | POST   | Chat requests (requires token)     |

## Code Changes

### 1. Types (`lib/ai/odai-types.ts`)

**Before:**
```typescript
export interface TokenRequest {
  grant_type: "client_credentials" | "refresh_token";
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
}
```

**After:**
```typescript
export interface AccessCodeRequest {
  access_code: string;
}

export interface SessionTokenResponse {
  session_token: string;
  token_type: "Bearer";
  expires_at: string;
  quota_remaining: number;
  quota_limit: number;
}

export interface SessionStatusResponse {
  session_token: string;
  quota_remaining: number;
  quota_limit: number;
  expires_at: string;
  is_valid: boolean;
}
```

### 2. Authentication (`lib/ai/odai-auth.ts`)

**Before:**
- `fetchAccessToken()` - OAuth2 client credentials
- `refreshAccessToken()` - Token refresh
- `getAccessToken()` - Get cached or new token

**After:**
- `authenticateWithAccessCode()` - Exchange access code for session token
- `getSessionStatus()` - Check session validity
- `revokeToken()` - Logout
- `getSessionToken()` - Get current session token

### 3. Session Management (`lib/session-manager.ts`)

New file for frontend session management:
- `saveSession()` - Store session in sessionStorage
- `getSession()` - Retrieve session from sessionStorage
- `clearSession()` - Remove session
- `isSessionValid()` - Check if session is valid
- `updateSessionQuota()` - Update quota after requests

### 4. UI Components

**New Components:**
- `components/access-code-modal.tsx` - Modal for entering access code
- `hooks/use-auth.ts` - Authentication state management hook

**Updated Components:**
- `components/chat.tsx` - Integrated authentication handling
  - Shows access code modal on 401 errors
  - Includes session token in API requests

### 5. API Routes

**New Routes:**
- `app/(chat)/api/auth/access/route.ts` - Access code authentication
- `app/(chat)/api/auth/status/route.ts` - Session status check
- `app/(chat)/api/auth/revoke/route.ts` - Token revocation

**Updated Routes:**
- `app/(chat)/api/chat/route.ts` - Accepts session token from Authorization header

## Environment Variables

### Before
```bash
ODAI_API_BASE_URL=http://45.63.92.192:52847
ODAI_CLIENT_ID=your-client-id
ODAI_CLIENT_SECRET=your-client-secret
ODAI_ACCESS_TOKEN=your-access-token  # Optional
```

### After
```bash
ODAI_API_BASE_URL=http://45.63.92.192:52847
ODAI_ACCESS_TOKEN=your-session-token  # Optional, bypasses UI auth
```

## Valid Access Codes (Dev/Testing)

- `DEMO2025`
- `INVESTOR-A`
- `PARTNER-B`
- `BETA-TEST`
- `ADMIN-KEY`

## Testing the Changes

1. **Start the development server:**
   ```bash
   pnpm dev
   ```

2. **Open http://localhost:3000**

3. **You'll be prompted for an access code** - Enter `DEMO2025`

4. **Session is valid for 60 minutes** with up to 50 requests

5. **On session expiry or quota exceeded**, you'll be prompted again

## Error Handling

### 401 Unauthorized
- **Before:** Generic error message
- **After:** Automatically shows access code modal

### 429 Quota Exceeded
- **Before:** N/A
- **After:** Session cleared, prompts for new access code

### Session Expiry
- **Before:** N/A
- **After:** Automatically detected, prompts for new access code

## Migration Checklist

- [x] Remove OAuth2 client credentials logic
- [x] Remove token refresh logic
- [x] Implement access code authentication
- [x] Create session management utilities
- [x] Add access code input UI
- [x] Update error handling for 401 responses
- [x] Add session token to API requests
- [x] Update README with new flow
- [x] Remove `ODAI_CLIENT_ID` and `ODAI_CLIENT_SECRET` from `.env.local`

## Rollback Plan

If you need to rollback to the old authentication:

1. Restore the old `lib/ai/odai-auth.ts` from git history
2. Restore the old `lib/ai/odai-types.ts` from git history
3. Remove new authentication files:
   - `lib/session-manager.ts`
   - `components/access-code-modal.tsx`
   - `hooks/use-auth.ts`
   - `app/(chat)/api/auth/` directory
4. Restore environment variables in `.env.local`
5. Revert changes to `components/chat.tsx` and `app/(chat)/api/chat/route.ts`

## Support

For questions or issues, please refer to the ODAI API documentation or contact the ODAI team.

