import { PhoneCall, PhoneOff } from 'lucide-react';

import type { LivekitStatus } from '../../hooks/useLivekitCall';

interface LivekitCallModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  roomName: string;
  status: LivekitStatus;
  participants: string[];
  logs: string[];
  onClose: () => void;
}

export default function LivekitCallModal({
  isOpen,
  title,
  subtitle,
  roomName,
  status,
  participants,
  logs,
  onClose,
}: LivekitCallModalProps) {
  if (!isOpen) return null;

  return (
    <div id="livekit-web-call-modal" className="fixed inset-0 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col justify-between h-[560px] text-white font-sans">
        <div className="text-center shrink-0 border-b border-slate-800 pb-4">
          <div className="w-14 h-14 rounded-full bg-sky-500/10 border border-sky-400 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <PhoneCall className="w-7 h-7 text-sky-400" />
          </div>
          <h3 className="text-lg font-serif font-bold text-white tracking-wide">
            {title || 'Duong truyen Voice WebRTC LiveKit'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {subtitle ? `${subtitle} - ` : ''}Phong thoai:{' '}
            <span className="font-mono text-sky-400 font-bold">{roomName}</span>
          </p>

          <div className="mt-3 flex items-center justify-center space-x-1.5">
            {status === 'connecting' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono tracking-wider animate-pulse">
                DANG KET NOI...
              </span>
            )}
            {status === 'connected' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono tracking-wider animate-bounce">
                LIEN KET THANH CONG
              </span>
            )}
            {status === 'disconnected' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono">
                DA NGAT LIEN KET
              </span>
            )}
            {status === 'error' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/40 font-mono">
                CANH BAO LOI DUONG TRUYEN
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2 my-4 h-16 shrink-0 bg-slate-950/40 rounded-2xl border border-slate-800/60 p-2">
          {status === 'connected' ? (
            <>
              <div className="w-1.5 bg-sky-400 h-8 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1.5 bg-sky-400 h-14 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              <div className="w-1.5 bg-sky-400 h-5 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 bg-sky-400 h-10 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              <div className="w-1.5 bg-sky-400 h-14 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1.5 bg-sky-400 h-7 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
              <div className="w-1.5 bg-sky-400 h-4 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </>
          ) : (
            <div className="text-slate-500 text-xs font-mono select-none">Thiet bi dang cho truyen tai goi song tin WebRTC...</div>
          )}
        </div>

        <div className="bg-slate-950/60 rounded-xl p-3 mb-3 border border-slate-800/80 shrink-0 text-xs">
          <span className="text-slate-400 font-mono uppercase tracking-wider block mb-2 font-bold text-[10px]">Thanh vien trong phong:</span>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-300 font-mono text-[11px] font-bold">
              Caller hien tai
            </span>
            {participants.length === 0 ? (
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700/80 rounded-lg text-slate-400 italic text-[11px]">
                Dang doi thanh vien con lai ket noi...
              </span>
            ) : (
              participants.map((participant, index) => (
                <span key={`${participant}-${index}`} className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-300 font-mono text-[11px] font-bold">
                  {participant}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 bg-slate-950/90 border border-slate-850 rounded-2xl p-4 overflow-y-auto space-y-1.5 scrollbar-thin text-stone-350 font-mono text-[11px] leading-relaxed mb-4">
          <div className="text-[10px] text-sky-400 font-bold uppercase tracking-widest border-b border-slate-900 pb-1.5 mb-2 flex justify-between">
            <span>LiveKit WebRTC Logs</span>
            <span className="animate-pulse">ONLINE</span>
          </div>
          {logs.map((log, index) => (
            <div key={`${index}-${log}`} className="transition-all py-0.5 border-b border-slate-900/30">
              <span className="text-slate-500 mr-1.5 font-bold">[{index + 1}]</span>
              <span className={log.startsWith('ERROR') || log.startsWith('FATAL') ? 'text-rose-400 font-bold' : log.startsWith('OK') || log.startsWith('READY') ? 'text-emerald-400 font-semibold' : log.startsWith('WARNING') ? 'text-amber-400' : 'text-slate-300'}>
                {log}
              </span>
            </div>
          ))}
        </div>

        <div className="shrink-0 flex space-x-3">
          <button
            onClick={onClose}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm transition-colors border border-rose-500/20"
          >
            <PhoneOff className="w-4 h-4 text-white" />
            <span>Gac may ket noi LiveKit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
