import React, { useState, useEffect } from 'react';
import { Film, Share2, Eye, ShieldCheck, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { Reel } from '../../types';
import { getPublishedReels } from '../../services/reelsService';
import { useAuth } from '../../context/AuthContext';

export const ReelsFeed: React.FC<{ onOpenAdminReels?: () => void }> = ({ onOpenAdminReels }) => {
  const { isAdmin } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const list = await getPublishedReels();
        setReels(list || []);
      } catch (err) {
        console.error('Failed to load reels:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleShare = (reel: Reel) => {
    if (navigator.share) {
      navigator.share({
        title: reel.title,
        text: reel.description,
        url: reel.videoUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(reel.videoUrl);
      setCopiedId(reel.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <Film className="w-8 h-8 animate-pulse text-blue-500" />
          <span className="text-xs font-semibold">Loading Curated Business Reels...</span>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-blue-400">
          <Film className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold">No Reels Published Yet</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Business training webinars and affiliate strategy videos published by administrators will appear here.
        </p>
        {isAdmin && onOpenAdminReels && (
          <button
            onClick={onOpenAdminReels}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
          >
            Add First Reel in Admin Panel
          </button>
        )}
      </div>
    );
  }

  const currentReel = reels[currentIndex];

  return (
    <div className="relative h-[calc(100vh-4rem)] bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Navigation Controls (Desktop / Tablet) */}
      <div className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-3 z-30">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white disabled:opacity-30 border border-slate-700 transition cursor-pointer shadow-lg"
          title="Previous Reel"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === reels.length - 1}
          className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white disabled:opacity-30 border border-slate-700 transition cursor-pointer shadow-lg"
          title="Next Reel"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Reel Card Viewport */}
      <div className="relative w-full max-w-sm sm:max-w-md h-full max-h-[850px] bg-black sm:rounded-2xl overflow-hidden border-x sm:border border-slate-800 shadow-2xl flex flex-col justify-between">
        {/* Top Overlay Badge */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-xs text-white">
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md font-semibold text-[11px] border border-white/10">
            {currentReel.category}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono tabular-nums border border-white/10">
            <span>{currentIndex + 1}</span>
            <span className="text-slate-400">/</span>
            <span>{reels.length}</span>
          </div>
        </div>

        {/* Video Embed */}
        <div className="w-full h-full flex items-center justify-center bg-black">
          <iframe
            src={currentReel.embedUrl}
            title={currentReel.title}
            className="w-full h-full border-0 object-cover"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Bottom Scrim & Info */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-5 bg-gradient-to-t from-black via-black/80 to-transparent text-white pt-14">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Official Content</span>
              </div>
              <h2 className="text-base font-bold leading-tight">{currentReel.title}</h2>
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {currentReel.description}
              </p>
            </div>

            {/* Share button */}
            <button
              onClick={() => handleShare(currentReel)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition cursor-pointer shrink-0"
              title="Share Reel"
            >
              {copiedId === currentReel.id ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
