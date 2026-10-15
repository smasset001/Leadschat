# Security Specification: Leads Chat ABAC & Firestore Rules

## 1. Data Invariants

1. **Default Deny**: Any path not explicitly allowed must be rejected by default.
2. **Identity & PII Isolation**:
   - Public user profiles (`/users/{userId}`) contain display name, photo, role, and business info.
   - PII such as email, phone, and lead balance reside in `/userPrivate/{userId}` and can ONLY be read or written by the document owner or an authenticated admin.
   - Self-escalation is blocked: a user cannot set their own role to 'admin' or alter their lead balance directly.
3. **Conversations & Messaging**:
   - Direct and group conversations (`/conversations/{convId}`) are restricted to participants (`request.auth.uid in resource.data.participantIds`).
   - Messages can only be read and created by authorized conversation participants.
   - Message size is strictly capped at 4000 characters.
4. **Admin-Only Business Content**:
   - Reels (`/reels/{reelId}`): Only administrators can create, update, or delete reels. All authenticated users can read published reels.
   - Webinars & Announcements: Only administrators can create or update them.
   - Lead Inventory (`/leadInventory/{id}`): Admin only read/write.
5. **Lead Bank & CRM Isolation**:
   - Affiliates can only view and update their own assigned leads (`/leadAssignments/{id}` where `resource.data.affiliateId == request.auth.uid`).
   - Affiliates cannot view or edit leads assigned to other affiliates.
   - Balance changes in `/userPrivate/{userId}` and `/leadLedger` are performed by administrator verification operations.
6. **Campaign & Chat Links**:
   - Only link owners (`userId == request.auth.uid`) or admins can edit their chat links.
   - Link events (clicks, signups) can be logged by the attribution system, but read access is restricted to the owning affiliate or admin.
7. **Audit Records**:
   - `/adminAuditLogs/{logId}` is append-only by administrators and cannot be altered or deleted.

---

## 2. The "Dirty Dozen" Payloads (Designed to Fail)

1. **Payload 1 (Self-Assigned Admin)**: User attempts to create their profile with `role: "admin"` directly.
2. **Payload 2 (PII Snooping)**: User attempts to `get` another user's `/userPrivate/{targetUid}`.
3. **Payload 3 (Unauthorized Message Reading)**: User attempts to read `/conversations/{convId}/messages` where `request.auth.uid` is NOT in `participantIds`.
4. **Payload 4 (Reel Tampering)**: Free or Pro user attempts to `setDoc` on `/reels/{reelId}`.
5. **Payload 5 (Lead Theft)**: User queries `/leadAssignments` where `affiliateId != request.auth.uid`.
6. **Payload 6 (Balance Injection)**: User attempts to `updateDoc` on `/userPrivate/{uid}` adding +500 to `leadBalance`.
7. **Payload 7 (Oversized Message DOS)**: User attempts to send a message with `text.size() > 4000`.
8. **Payload 8 (Inventory Extraction)**: User attempts to read `/leadInventory` collection.
9. **Payload 9 (Purchase Self-Approval)**: User updates `status: "approved"` on `/leadPurchaseRequests/{reqId}` without admin authority.
10. **Payload 10 (Audit Log Deletion)**: Any user attempts to `delete` an entry from `/adminAuditLogs`.
11. **Payload 11 (Campaign Link Hijack)**: User updates `/chatLinks/{id}` where `userId != request.auth.uid`.
12. **Payload 12 (Phone Registry Poisoning)**: User updates `/phoneRegistry/{hash}` pointing to another user ID.
