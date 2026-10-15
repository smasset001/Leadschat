export type UserRole = 'free' | 'pro' | 'admin';

export type SubscriptionStatus = 'free' | 'pro_active' | 'pro_expired' | 'pro_suspended';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  businessName?: string;
  businessDescription?: string;
  customChatSlug?: string;
  role: UserRole;
  isPro: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPrivate {
  uid: string;
  email: string;
  mobileNumber?: string;
  approvedEntitlement: number;
  leadBalance: number;
  leadsDelivered: number;
  subscriptionStatus: SubscriptionStatus;
  proExpiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participantIds: string[];
  participantDetails: Record<string, {
    displayName: string;
    photoURL?: string;
    businessName?: string;
  }>;
  groupName?: string;
  groupDescription?: string;
  groupOwnerId?: string;
  lastMessage?: string;
  lastMessageSenderId?: string;
  lastMessageAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  readBy?: string[];
}

export interface ChatLink {
  id: string;
  userId: string;
  slug: string;
  linkName: string;
  campaignName?: string;
  source?: string;
  destinationType: 'direct_chat' | 'business_profile';
  isActive: boolean;
  clicks: number;
  signups: number;
  chatsStarted: number;
  createdAt: string;
  updatedAt?: string;
}

export interface LinkEvent {
  id: string;
  linkId: string;
  affiliateId: string;
  eventType: 'click' | 'signup' | 'chat_start';
  campaign?: string;
  source?: string;
  createdAt: string;
}

export interface Reel {
  id: string;
  title: string;
  description: string;
  category: string;
  videoUrl: string;
  embedUrl: string;
  thumbnailUrl?: string;
  isFeatured: boolean;
  isPublished: boolean;
  order: number;
  viewCount?: number;
  createdAt: string;
}

export interface Webinar {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  timezone: string;
  joinUrl: string;
  isCancelled: boolean;
  isPublished: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high';
  isPublished: boolean;
  createdAt: string;
}

export interface LeadPackage {
  id: string;
  name: string;
  leadsCount: number;
  priceINR: number;
  description: string;
  isActive: boolean;
}

export interface LeadPurchaseRequest {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  packageId: string;
  leadsCount: number;
  amountINR: number;
  paymentMethod: string;
  paymentReference: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface LeadInventoryItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  source: string;
  status: 'available' | 'assigned' | 'invalid';
  assignedAffiliateId?: string;
  importedAt: string;
  assignedAt?: string;
}

export type LeadStatus = 
  | 'new'
  | 'called'
  | 'not_reachable'
  | 'interested'
  | 'follow_up_required'
  | 'converted'
  | 'not_interested'
  | 'invalid_number';

export interface LeadAssignment {
  id: string;
  affiliateId: string;
  leadInventoryId?: string;
  name: string;
  phone: string;
  email?: string;
  status: LeadStatus;
  remarks?: string;
  nextFollowUpDate?: string;
  lastContactedAt?: string;
  assignedAt: string;
  updatedAt?: string;
}

export interface LeadFollowUp {
  id: string;
  affiliateId: string;
  assignmentId: string;
  leadName: string;
  leadPhone: string;
  dueDate: string;
  notes?: string;
  completed: boolean;
  createdAt: string;
}

export interface LeadLedgerEntry {
  id: string;
  affiliateId: string;
  type: 'credit_purchase' | 'debit_allocation' | 'manual_adjustment';
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Broadcast {
  id: string;
  affiliateId: string;
  name: string;
  messageText: string;
  recipientCount: number;
  status: 'draft' | 'sent' | 'cancelled';
  recipientIds: string[];
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  recipientId: string;
  type: 'message' | 'lead_allocated' | 'payment_status' | 'webinar' | 'announcement' | 'pro_status';
  title: string;
  message: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetEntity: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface ApplicationSettings {
  id?: string;
  proMonthlyINR: number;
  proYearlyINR: number;
  manualPaymentInstructions: string;
  supportEmail: string;
  leadPriceDefaultINR: number;
  updatedAt?: string;
}
