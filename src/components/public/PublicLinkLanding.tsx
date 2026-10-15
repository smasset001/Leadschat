import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  Building,
  ArrowRight,
  ExternalLink,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { resolveChatLink, recordLinkClick, recordChatStart } from '../../services/linksService';
import { getOrCreateDirectConversation } from '../../services/chatService';
import { UserProfile, ChatLink } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_AVATAR_IMG, HERO_PREVIEW_IMG } from '../../assets/images';

interface PublicLinkLandingProps {
  slug: string;
  onOpenChat: (convId: string) => void;
  onOpenAuth: () => void;
}

export const PublicLinkLanding: React.FC<PublicLinkLandingProps> = ({
  slug,
  onOpenChat,
  onOpenAuth,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [chatLink, setChatLink] = useState<ChatLink | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function resolve() {
      try {
        const result = await resolveChatLink(slug);
        if (!result) {
          setNotFound(true);
        } else {
          setOwner(result.ownerProfile);
          setChatLink(result.link || null);

          // Record click event & save pending attribution
          if (result.link) {
            recordLinkClick(
              result.link.id,
              result.ownerProfile.uid,
              result.link.source || 'Direct',
              result.link.campaignName || 'General'
            );

            localStorage.setItem(
              'leads_chat_pending_attribution',
              JSON.stringify({
                linkId: result.link.id,
                affiliateId: result.ownerProfile.uid,
                campaign: result.link.campaignName,
                source: result.link.source,
                slug,
              })
            );
          }
        }
      } catch (err) {
        console.error('Error resolving chat link:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    resolve();
  }, [slug]);

  const handleStartChat = async () => {
    if (!owner) return;
    if (!currentUser) {
      // Store intent and trigger signup/login
      localStorage.setItem('leads_chat_target_chat_uid', owner.uid);
      onOpenAuth();
      return;
    }

    setActionLoading(true);
    try {
      if (chatLink) {
        await recordChatStart(chatLink.id, owner.uid);
      }
      const convId = await getOrCreateDirectConversation(
        {
          uid: currentUser.uid,
          displayName: userProfile?.displayName || currentUser.email || 'Visitor',
          photoURL: userProfile?.photoURL,
        },
        {
          uid: owner.uid,
          displayName: owner.displayName,
          photoURL: owner.photoURL,
          businessName: owner.businessName,
        }
      );
      onOpenChat(convId);
    } catch (err) {
      console.error('Failed to initiate conversation:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold">Resolving Business Profile...</span>
        </div>
      </div>
    );
  }

  if (notFound || !owner) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-md">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Chat Link Unavailable</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          The link <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">/{slug}</code> is expired, deactivated, or invalid.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
        >
          Return to Leads Chat
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-8 shadow-xl space-y-6 text-center">
        {/* Avatar & Trust Badge */}
        <div className="relative inline-block mx-auto">
          <img
            src={owner.photoURL || DEFAULT_AVATAR_IMG}
            alt={owner.displayName}
            referrerPolicy="no-referrer"
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mx-auto"
          />
          <div
            className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-md"
            title="Verified Business Partner"
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Identity Details */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600">
            <Building className="w-3.5 h-3.5" />
            <span>{owner.businessName || 'Verified Affiliate Partner'}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {owner.displayName}
          </h1>
          {owner.businessDescription && (
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed pt-2">
              "{owner.businessDescription}"
            </p>
          )}
        </div>

        {/* Campaign Info if present */}
        {chatLink?.campaignName && (
          <div className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 inline-block font-medium">
            Campaign: {chatLink.campaignName} &bull; Channel: {chatLink.source || 'Direct'}
          </div>
        )}

        {/* CTA Button */}
        <div className="pt-2">
          <button
            onClick={handleStartChat}
            disabled={actionLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            <span>
              {actionLoading
                ? 'Connecting to Secure Chat...'
                : `Start Direct Chat with ${owner.displayName.split(' ')[0]}`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-slate-400 mt-2">
            No phone number exposed publicly. Direct business communication backed by Leads Chat.
          </p>
        </div>
      </div>
    </div>
  );
};
