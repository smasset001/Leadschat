import React, { useState, useEffect } from 'react';
import { Radio, Send, Users, History, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Broadcast, Conversation } from '../../types';
import { getAffiliateBroadcasts, createAndSendBroadcast } from '../../services/broadcastService';
import { listenToConversations } from '../../services/chatService';

export const BroadcastSection: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [name, setName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    getAffiliateBroadcasts(currentUser.uid).then((b) => setBroadcasts(b || []));
    const unsub = listenToConversations(currentUser.uid, (list) => {
      // Filter out groups to show eligible direct contacts
      setConversations(list.filter((c) => c.type === 'direct'));
    });
    return () => unsub();
  }, [currentUser]);

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const all = conversations
      .map((c) => c.participantIds.find((id) => id !== currentUser?.uid))
      .filter(Boolean) as string[];
    setSelectedRecipientIds(Array.from(new Set(all)));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (selectedRecipientIds.length === 0) {
      setErrorMsg('Please select at least one recipient.');
      return;
    }
    setErrorMsg(null);
    setSending(true);

    try {
      const record = await createAndSendBroadcast(
        currentUser.uid,
        userProfile?.displayName || 'Affiliate',
        name,
        messageText,
        selectedRecipientIds
      );
      setSuccessMsg(`Broadcast "${name}" dispatched successfully to ${record.recipientCount} contacts.`);
      setName('');
      setMessageText('');
      setSelectedRecipientIds([]);
      const updated = await getAffiliateBroadcasts(currentUser.uid);
      setBroadcasts(updated || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Broadcast Creation Form */}
      <div className="p-6 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 shadow-md space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#ff4545]/10 text-[#ff4545] flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white light:text-slate-900">Create Direct Broadcast</h3>
            <p className="text-xs text-slate-400 light:text-slate-500">
              Send updates, webinar links, or follow-up notes directly into authorized client message threads.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 light:bg-red-50 light:border-red-200 light:text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 light:bg-emerald-50 light:border-emerald-200 light:text-emerald-800 text-xs">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
              Broadcast Title / Campaign Label *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekly Masterclass Invitation"
              className="w-full px-3.5 py-2.5 text-sm bg-[#141518] dark:bg-[#141518] light:bg-slate-50 text-white light:text-slate-900 border border-white/10 light:border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#ff4545]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300 light:text-slate-700">
                Select Recipients ({selectedRecipientIds.length} Selected)
              </label>
              {conversations.length > 0 && (
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-[#ff4545] hover:opacity-80 font-medium cursor-pointer"
                >
                  Select All Contacts
                </button>
              )}
            </div>

            {conversations.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#141518] dark:bg-[#141518] light:bg-slate-50 text-slate-400 text-xs text-center border border-white/5 light:border-slate-200">
                No active 1-on-1 contacts found. Once visitors chat via your links, they will appear here.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto p-2 rounded-2xl border border-white/10 light:border-slate-200 divide-y divide-white/5 light:divide-slate-100 bg-[#141518] dark:bg-[#141518] light:bg-slate-50">
                {conversations.map((c) => {
                  const targetId = c.participantIds.find((id) => id !== currentUser?.uid);
                  if (!targetId) return null;
                  const details = c.participantDetails?.[targetId];
                  const isChecked = selectedRecipientIds.includes(targetId);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 light:hover:bg-white cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRecipient(targetId)}
                          className="w-4 h-4 text-[#ff4545] rounded-sm accent-[#ff4545]"
                        />
                        <span className="font-semibold text-white light:text-slate-900">
                          {details?.displayName || 'Customer'}
                        </span>
                        {details?.businessName && (
                          <span className="text-[10px] text-slate-400">({details.businessName})</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono tabular-nums text-slate-400">
                        {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : ''}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
              Message Content (Max 4,000 characters) *
            </label>
            <textarea
              rows={4}
              required
              maxLength={4000}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Hi there! Just wanted to share our upcoming live session on closing B2B prospects..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#141518] dark:bg-[#141518] light:bg-slate-50 text-white light:text-slate-900 border border-white/10 light:border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#ff4545] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={sending || selectedRecipientIds.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] text-white text-xs font-bold shadow-md neu-coral-glow hover:opacity-95 transition cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Dispatching Broadcast...' : 'Dispatch Broadcast'}</span>
          </button>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white light:text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-[#ff4545]" />
          <span>Broadcast History</span>
        </h3>

        {broadcasts.length === 0 ? (
          <div className="p-6 rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white border border-[#26282f] dark:border-[#26282f] light:border-slate-200 text-center text-xs text-slate-400">
            No broadcast campaigns sent yet.
          </div>
        ) : (
          <div className="bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white rounded-3xl border border-[#26282f] dark:border-[#26282f] light:border-slate-200 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141518] dark:bg-[#141518] light:bg-slate-50 border-b border-[#26282f] dark:border-[#26282f] light:border-slate-200 text-slate-400 light:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Campaign Name</th>
                    <th className="px-4 py-3">Recipients</th>
                    <th className="px-4 py-3">Preview</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 light:divide-slate-100">
                  {broadcasts.map((b) => (
                    <tr key={b.id} className="hover:bg-white/5 light:hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono tabular-nums text-slate-400 light:text-slate-500">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-white light:text-slate-900">{b.name}</td>
                      <td className="px-4 py-3 font-mono tabular-nums font-semibold text-[#ff4545] light:text-blue-600">
                        {b.recipientCount}
                      </td>
                      <td className="px-4 py-3 text-slate-300 light:text-slate-600 max-w-xs truncate">
                        {b.messageText}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 light:bg-emerald-100 light:text-emerald-800">
                          <Check className="w-3 h-3" />
                          Delivered
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
