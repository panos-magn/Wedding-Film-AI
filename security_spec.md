# Security Specification with Payload-First TDD

This document defines the Security Specifications and mathematical invariants for the WeddingFilmAI Studio database layers as modeled in `firebase-blueprint.json`.

## 1. Data Invariants
1. **User Ownership**: A user profile document `/users/{userId}` can only be read or written if the `userId` matches the authenticated `request.auth.uid`.
2. **Project Owner Match**: A project document `/projects/{projectId}` must have its `ownerId` set to `request.auth.uid`. Nobody else can read, list, create, update, or delete this project.
3. **AI Result Safe Binding**: AI generation results in `/ai_results/{resultId}` must have their `ownerId` bound to `request.auth.uid`. The linked parent project in `projects/{projectId}` must exist and be owned by the same user.
4. **Field Type Integrity**: All fields (like `coupleNames`, `weddingDate`, `brandColors`) must meet the format, length, and types declared. No "shadow keys" or injected fields allowed.
5. **No Self-Privilege Escalation**: Standard fields such as roles are protected to ensure identity spoofing gets fully blocked.

---

## 2. The "Dirty Dozen" Malicious Payloads
The following 12 payloads are mathematically designed to assault standard security and must consistently return `PERMISSION_DENIED`:

### Payload #1: Identity Spoofing (Create Project for someone else)
```json
{
  "id": "project_malicious_1",
  "coupleNames": "Eve & Bob",
  "weddingDate": "2026-06-15",
  "location": "Athens",
  "style": "Cinematic",
  "status": "booked",
  "ownerId": "attacker_123" // Spoofed ownerId instead of logged in user UID
}
```

### Payload #2: Shadow Field Injection (Shadow Update)
```json
{
  "coupleNames": "Alex & Maria",
  "weddingDate": "2026-06-15",
  "ownerId": "victim_uid",
  "isAdmin": true, // Ghost field injected to attempt privilege escalation
  "injectedMaliciousField": "evil_payload"
}
```

### Payload #3: Invalid ID Character Poisoning (Denial of Wallet / ID Injection)
Attempt to write to `/projects/project%2F..%2F..%2Fhack` or key with malicious characters.
```json
{
  "id": "hack_!@#$%^&*()_+",
  "coupleNames": "Eve & Bob",
  "weddingDate": "2026-10-10",
  "ownerId": "victim_uid"
}
```

### Payload #4: Large Payload Injection (Denial of Wallet via Big Size)
```json
{
  "coupleNames": "Super long string > 10KB to exhaust memory and project storage units ... [Repeated 5000 times]",
  "weddingDate": "2026-06-15",
  "ownerId": "victim_uid"
}
```

### Payload #5: Unauthenticated Access (Write without Token)
```json
{
  "coupleNames": "Alice & Bob",
  "weddingDate": "2026-08-15"
}
```
*(With request.auth == null)*

### Payload #6: Unverified Email Hijacking
An authenticated token with `email_verified == false` attempting to access database structures that require a verified account.

### Payload #7: Sibling Read (Read someone else's project)
Authenticated User `B` attempting `get` or `list` on a Project whose true `ownerId` is User `A`.

### Payload #8: Cross-Tenant Relational write (Saved AI result for unowned project)
```json
{
  "id": "result_1",
  "projectId": "victim_project_id", // Project belongs to User A
  "moduleType": "storytelling",
  "content": "Innocent story",
  "ownerId": "attacker_uid" // AI Result created by User B (attacker)
}
```

### Payload #9: Client-Side Timestamp Spoofing (Immutability violation of createdAt)
```json
{
  "coupleNames": "Jane & John",
  "weddingDate": "2026-07-20",
  "createdAt": "2000-01-01T00:00:00.000Z", // Faked timestamp
  "ownerId": "victim_uid"
}
```

### Payload #10: Invalid Type Injection (Value Poisoning)
```json
{
  "coupleNames": true, // Boolean instead of String
  "weddingDate": "2026-07-20",
  "ownerId": "victim_uid"
}
```

### Payload #11: Empty Required Fields
```json
{
  "coupleNames": "", // Short/empty invalid couple names
  "weddingDate": "2026-12-31",
  "ownerId": "victim_uid"
}
```

### Payload #12: Bypassing Immutable Owner UID on Update
```json
{
  "coupleNames": "Revised Name",
  "weddingDate": "2026-06-15",
  "ownerId": "someone_else_uid" // Modifying ownerId to steal or transfer ownership
}
```

---

## 3. The Test Runner Reference (`firestore.rules.test.ts`)
Standard unit validations that test rules against unauthorized reads and writes of the "Dirty Dozen" payloads.

All rules validated locally or in emulator always reject transactions that violate the established schema definitions.
