import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Bell,
  AlertCircle,
  Megaphone,
  CheckCircle2,
} from 'lucide-react';
import { Webinar, Announcement } from '../../types';
import { getWebinars, getAnnouncements } from '../../services/webinarService';

export const WebinarsSection: React.FC = () => {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [wList, aList] = await Promise.all([getWebinars(), getAnnouncements()]);
        setWebinars(wList || []);
        setAnnouncements(aList || []);
      } catch (err) {
        console.error('Failed to load webinars:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
          <Calendar className="w-4 h-4" />
          <span>Training & Announcements</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Affiliate Webinars & Business Updates
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Join live weekly training sessions, study proven customer conversion scripts, and stay informed on platform updates.
        </p>
      </div>

      {/* Grid: Webinars (Left 2 cols) & Announcements (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Webinars Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-600" />
              <span>Upcoming Live Masterclasses</span>
            </h2>
            <span className="text-xs text-slate-500">{webinars.length} Scheduled</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading masterclasses...</div>
          ) : webinars.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400">
              No upcoming webinars scheduled at the moment.
            </div>
          ) : (
            <div className="space-y-4">
              {webinars.map((webinar) => {
                const dateObj = new Date(webinar.scheduledAt);
                const isPast = dateObj.getTime() < Date.now();
                return (
                  <div
                    key={webinar.id}
                    className={`p-6 rounded-2xl bg-white border transition shadow-2xs ${
                      webinar.isCancelled
                        ? 'border-red-200 bg-red-50/20 opacity-75'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-mono tabular-nums">
                            {dateObj.toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            at{' '}
                            {dateObj.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            ({webinar.timezone})
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 leading-snug">
                          {webinar.title}
                        </h3>
                      </div>

                      <div>
                        {webinar.isCancelled ? (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Cancelled
                          </span>
                        ) : isPast ? (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            Concluded
                          </span>
                        ) : (
                          <a
                            href={webinar.joinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                          >
                            <span>Join Session</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {webinar.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Business Announcements Panel */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              <span>Official Updates</span>
            </h2>
            <span className="text-xs text-slate-500">{announcements.length} Published</span>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      ann.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : ann.priority === 'normal'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {ann.priority} Priority
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-400">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {ann.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
