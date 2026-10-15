import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  LeadPackage,
  LeadPurchaseRequest,
  LeadInventoryItem,
  LeadAssignment,
  LeadLedgerEntry,
  LeadStatus,
  UserPrivate,
} from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

const DEFAULT_PACKAGES: Omit<LeadPackage, 'id'>[] = [
  {
    name: 'Starter Tier',
    leadsCount: 50,
    priceINR: 800,
    description: 'Perfect for new affiliates testing lead follow-ups and calling scripts.',
    isActive: true,
  },
  {
    name: 'Growth Pack',
    leadsCount: 100,
    priceINR: 1500,
    description: 'Recommended. 100 fresh qualified business leads ready for conversion.',
    isActive: true,
  },
  {
    name: 'Pro Scale',
    leadsCount: 250,
    priceINR: 3500,
    description: 'Higher volume package with prioritized distribution allocations.',
    isActive: true,
  },
  {
    name: 'Enterprise Bank',
    leadsCount: 500,
    priceINR: 6500,
    description: 'Maximum volume discount for established sales teams and affiliates.',
    isActive: true,
  },
];

export async function getLeadPackages(): Promise<LeadPackage[]> {
  try {
    const q = query(collection(db, 'leadPackages'));
    const snap = await getDocs(q);
    if (snap.empty) {
      // Seed default packages
      const seeded: LeadPackage[] = [];
      for (const p of DEFAULT_PACKAGES) {
        const ref = doc(collection(db, 'leadPackages'));
        const pkg: LeadPackage = { id: ref.id, ...p };
        await setDoc(ref, pkg);
        seeded.push(pkg);
      }
      return seeded;
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeadPackage));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'leadPackages');
  }
}

export async function submitPurchaseRequest(params: {
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  packageId: string;
  leadsCount: number;
  amountINR: number;
  paymentMethod: string;
  paymentReference: string;
  notes?: string;
}): Promise<string> {
  const reqRef = doc(collection(db, 'leadPurchaseRequests'));
  const now = new Date().toISOString();

  const newRequest: LeadPurchaseRequest = {
    id: reqRef.id,
    affiliateId: params.affiliateId,
    affiliateName: params.affiliateName,
    affiliateEmail: params.affiliateEmail,
    packageId: params.packageId,
    leadsCount: params.leadsCount,
    amountINR: params.amountINR,
    paymentMethod: params.paymentMethod,
    paymentReference: params.paymentReference.trim(),
    status: 'pending',
    notes: params.notes?.trim() || '',
    createdAt: now,
  };

  try {
    await setDoc(reqRef, newRequest);

    // Notify user
    await addDoc(collection(db, 'notifications'), {
      recipientId: params.affiliateId,
      type: 'payment_status',
      title: 'Lead Purchase Submitted',
      message: `Your purchase request for ${params.leadsCount} leads (₹${params.amountINR}) has been submitted for verification.`,
      relatedEntityId: reqRef.id,
      isRead: false,
      createdAt: now,
    });

    return reqRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `leadPurchaseRequests/${reqRef.id}`);
  }
}

export async function getAffiliatePurchaseRequests(affiliateId: string): Promise<LeadPurchaseRequest[]> {
  try {
    const q = query(
      collection(db, 'leadPurchaseRequests'),
      where('affiliateId', '==', affiliateId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeadPurchaseRequest));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'leadPurchaseRequests');
  }
}

export async function getAllPurchaseRequestsAdmin(): Promise<LeadPurchaseRequest[]> {
  try {
    const snap = await getDocs(collection(db, 'leadPurchaseRequests'));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeadPurchaseRequest));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'leadPurchaseRequests');
  }
}

export async function adminApprovePurchase(
  requestId: string,
  adminUid: string,
  adminEmail: string
) {
  try {
    const reqRef = doc(db, 'leadPurchaseRequests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) throw new Error('Purchase request not found');

    const reqData = reqSnap.data() as LeadPurchaseRequest;
    if (reqData.status !== 'pending') {
      throw new Error(`Cannot approve request with status '${reqData.status}' - already processed.`);
    }

    const now = new Date().toISOString();
    const affiliateId = reqData.affiliateId;
    const leadsToAdd = reqData.leadsCount;

    // Get current affiliate private profile
    const privateRef = doc(db, 'userPrivate', affiliateId);
    const privateSnap = await getDoc(privateRef);
    const currentPrivate = privateSnap.exists()
      ? (privateSnap.data() as UserPrivate)
      : { leadBalance: 0, approvedEntitlement: 0 };

    const newBalance = (currentPrivate.leadBalance || 0) + leadsToAdd;
    const newEntitlement = (currentPrivate.approvedEntitlement || 0) + leadsToAdd;

    // 1. Update request status
    await updateDoc(reqRef, {
      status: 'approved',
      reviewedBy: adminEmail,
      reviewedAt: now,
    });

    // 2. Update affiliate private record
    await updateDoc(privateRef, {
      leadBalance: newBalance,
      approvedEntitlement: newEntitlement,
      updatedAt: now,
    });

    // 3. Write immutable ledger entry
    await addDoc(collection(db, 'leadLedger'), {
      affiliateId,
      type: 'credit_purchase',
      amount: leadsToAdd,
      balanceAfter: newBalance,
      referenceId: requestId,
      notes: `Approved payment ref: ${reqData.paymentReference} (₹${reqData.amountINR})`,
      createdBy: adminEmail,
      createdAt: now,
    });

    // 4. Send In-App notification
    await addDoc(collection(db, 'notifications'), {
      recipientId: affiliateId,
      type: 'payment_status',
      title: 'Lead Payment Approved!',
      message: `${leadsToAdd} lead credits have been added to your Lead Bank balance.`,
      relatedEntityId: requestId,
      isRead: false,
      createdAt: now,
    });

    // 5. Admin audit log
    await addDoc(collection(db, 'adminAuditLogs'), {
      actorId: adminUid,
      actorEmail: adminEmail,
      action: 'APPROVE_LEAD_PURCHASE',
      targetEntity: 'leadPurchaseRequests',
      targetId: requestId,
      details: `Approved ${leadsToAdd} leads for affiliate ${affiliateId}. Payment Ref: ${reqData.paymentReference}`,
      createdAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `leadPurchaseRequests/${requestId}`);
  }
}

export async function adminRejectPurchase(
  requestId: string,
  adminUid: string,
  adminEmail: string,
  notes: string
) {
  try {
    const reqRef = doc(db, 'leadPurchaseRequests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) throw new Error('Purchase request not found');

    const reqData = reqSnap.data() as LeadPurchaseRequest;
    if (reqData.status !== 'pending') {
      throw new Error(`Cannot reject request with status '${reqData.status}'`);
    }

    const now = new Date().toISOString();
    await updateDoc(reqRef, {
      status: 'rejected',
      notes: notes.trim(),
      reviewedBy: adminEmail,
      reviewedAt: now,
    });

    await addDoc(collection(db, 'notifications'), {
      recipientId: reqData.affiliateId,
      type: 'payment_status',
      title: 'Lead Purchase Rejected',
      message: `Your purchase request could not be verified. Note: ${notes}`,
      relatedEntityId: requestId,
      isRead: false,
      createdAt: now,
    });

    await addDoc(collection(db, 'adminAuditLogs'), {
      actorId: adminUid,
      actorEmail: adminEmail,
      action: 'REJECT_LEAD_PURCHASE',
      targetEntity: 'leadPurchaseRequests',
      targetId: requestId,
      details: `Rejected purchase request ${requestId} for ${reqData.affiliateId}. Reason: ${notes}`,
      createdAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `leadPurchaseRequests/${requestId}`);
  }
}

export async function adminImportLeads(
  leads: Array<{ name: string; phone: string; email?: string; source?: string; notes?: string }>,
  adminUid: string,
  adminEmail: string
): Promise<{ imported: number; duplicates: number }> {
  const now = new Date().toISOString();
  let imported = 0;
  let duplicates = 0;

  // Track existing phone numbers
  const existingInventorySnap = await getDocs(collection(db, 'leadInventory'));
  const existingPhones = new Set(
    existingInventorySnap.docs.map((d) => d.data().phone?.replace(/[^0-9]/g, ''))
  );

  for (const item of leads) {
    const cleanPhone = item.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) continue;

    if (existingPhones.has(cleanPhone)) {
      duplicates++;
      continue;
    }

    existingPhones.add(cleanPhone);
    const leadRef = doc(collection(db, 'leadInventory'));
    const inventoryItem: LeadInventoryItem = {
      id: leadRef.id,
      name: item.name.trim() || 'Prospective Client',
      phone: item.phone.trim(),
      email: item.email?.trim() || '',
      source: item.source?.trim() || 'CSV Import',
      notes: item.notes?.trim() || '',
      status: 'available',
      importedAt: now,
    };
    await setDoc(leadRef, inventoryItem);
    imported++;
  }

  // Audit log
  await addDoc(collection(db, 'adminAuditLogs'), {
    actorId: adminUid,
    actorEmail: adminEmail,
    action: 'IMPORT_LEADS_CSV',
    targetEntity: 'leadInventory',
    targetId: 'batch',
    details: `Imported ${imported} leads successfully. Ignored ${duplicates} duplicates.`,
    createdAt: now,
  });

  return { imported, duplicates };
}

export async function getLeadInventoryStats() {
  try {
    const snap = await getDocs(collection(db, 'leadInventory'));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeadInventoryItem));

    const available = items.filter((i) => i.status === 'available').length;
    const assigned = items.filter((i) => i.status === 'assigned').length;
    const invalid = items.filter((i) => i.status === 'invalid').length;

    return {
      total: items.length,
      available,
      assigned,
      invalid,
      items,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'leadInventory');
  }
}

export async function adminAllocateLeads(params: {
  affiliateId: string;
  affiliateName: string;
  quantity: number;
  adminUid: string;
  adminEmail: string;
}) {
  const { affiliateId, affiliateName, quantity, adminUid, adminEmail } = params;
  if (quantity <= 0) throw new Error('Quantity must be greater than 0');

  // Verify affiliate lead balance
  const privateRef = doc(db, 'userPrivate', affiliateId);
  const privateSnap = await getDoc(privateRef);
  if (!privateSnap.exists()) throw new Error('Affiliate private profile not found');

  const privateData = privateSnap.data() as UserPrivate;
  const currentBalance = privateData.leadBalance || 0;
  if (currentBalance < quantity) {
    throw new Error(
      `Insufficient lead entitlement balance! Affiliate currently has ${currentBalance} available credits, requested ${quantity}.`
    );
  }

  // Fetch available leads from inventory
  const availQuery = query(
    collection(db, 'leadInventory'),
    where('status', '==', 'available'),
    limit(quantity)
  );
  const availSnap = await getDocs(availQuery);
  if (availSnap.docs.length < quantity) {
    throw new Error(
      `Insufficient available leads in inventory pool! Requested ${quantity}, but only ${availSnap.docs.length} leads are available to allocate.`
    );
  }

  const now = new Date().toISOString();
  const leadsToAssign = availSnap.docs.map((d) => ({ id: d.id, ...d.data() } as LeadInventoryItem));

  // Perform updates
  for (const lead of leadsToAssign) {
    // 1. Mark inventory as assigned
    await updateDoc(doc(db, 'leadInventory', lead.id), {
      status: 'assigned',
      assignedAffiliateId: affiliateId,
      assignedAt: now,
    });

    // 2. Create lead assignment in affiliate CRM
    const assignRef = doc(collection(db, 'leadAssignments'));
    const assignment: LeadAssignment = {
      id: assignRef.id,
      affiliateId,
      leadInventoryId: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      status: 'new',
      remarks: lead.notes || `Allocated on ${new Date().toLocaleDateString()}`,
      assignedAt: now,
      updatedAt: now,
    };
    await setDoc(assignRef, assignment);
  }

  // Update affiliate balance & delivered count
  const newBalance = currentBalance - quantity;
  const newDelivered = (privateData.leadsDelivered || 0) + quantity;
  await updateDoc(privateRef, {
    leadBalance: newBalance,
    leadsDelivered: newDelivered,
    updatedAt: now,
  });

  // Append to ledger
  await addDoc(collection(db, 'leadLedger'), {
    affiliateId,
    type: 'debit_allocation',
    amount: -quantity,
    balanceAfter: newBalance,
    notes: `Manually distributed batch of ${quantity} leads by administrator.`,
    createdBy: adminEmail,
    createdAt: now,
  });

  // Notify affiliate
  await addDoc(collection(db, 'notifications'), {
    recipientId: affiliateId,
    type: 'lead_allocated',
    title: 'New Leads Delivered!',
    message: `${quantity} fresh leads have been assigned to your Lead CRM. Remaining balance: ${newBalance}.`,
    isRead: false,
    createdAt: now,
  });

  // Admin audit log
  await addDoc(collection(db, 'adminAuditLogs'), {
    actorId: adminUid,
    actorEmail: adminEmail,
    action: 'ALLOCATE_LEADS_MANUAL',
    targetEntity: 'leadAssignments',
    targetId: affiliateId,
    details: `Allocated ${quantity} leads to affiliate ${affiliateName} (${affiliateId}).`,
    createdAt: now,
  });
}

export async function getAffiliateLeadAssignments(affiliateId: string): Promise<LeadAssignment[]> {
  try {
    const q = query(
      collection(db, 'leadAssignments'),
      where('affiliateId', '==', affiliateId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeadAssignment));
    list.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'leadAssignments');
  }
}

export async function updateLeadAssignmentStatus(
  assignmentId: string,
  updates: {
    status: LeadStatus;
    remarks?: string;
    nextFollowUpDate?: string;
  }
) {
  try {
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'leadAssignments', assignmentId), {
      status: updates.status,
      remarks: updates.remarks || '',
      nextFollowUpDate: updates.nextFollowUpDate || null,
      lastContactedAt: now,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `leadAssignments/${assignmentId}`);
  }
}

export async function getAffiliateLedger(affiliateId: string): Promise<LeadLedgerEntry[]> {
  try {
    const q = query(
      collection(db, 'leadLedger'),
      where('affiliateId', '==', affiliateId)
    );
    const snap = await getDocs(q);
    const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeadLedgerEntry));
    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return entries;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'leadLedger');
  }
}
