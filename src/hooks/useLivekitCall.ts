import { useState } from 'react';

export type LivekitStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface StartLivekitCallArgs {
  callerIdentity: string;
  roomName: string;
  subtitle?: string;
  title?: string;
}

export function useLivekitCall() {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [status, setStatus] = useState<LivekitStatus>('idle');
  const [isOpen, setIsOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const startCall = async ({ callerIdentity, roomName, subtitle, title }: StartLivekitCallArgs) => {
    setIsOpen(true);
    setStatus('connecting');
    setRoomName(roomName);
    setTitle(title || '');
    setSubtitle(subtitle || '');
    setParticipants([]);
    setLogs(['[LiveKit] Dang yeu cau access token tu he thong...']);

    try {
      const res = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, identity: callerIdentity }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setStatus('error');
        setLogs((prev) => [...prev, `ERROR: ${errorData.error || 'Khong tai duoc token LiveKit'}`]);
        return;
      }

      const data = await res.json();
      setToken(data.token);
      setUrl(data.url);
      setLogs((prev) => [
        ...prev,
        'OK: Da cap token thanh cong tu server',
        `CONNECTING: Dang vao phong ${roomName}`,
        `IDENTITY: ${callerIdentity}`,
      ]);

      const lk = await import('livekit-client');
      const roomInstance = new lk.Room({
        adaptiveStream: true,
        dynacast: true,
      });

      roomInstance.on(lk.RoomEvent.ParticipantConnected, (participant) => {
        setLogs((prev) => [...prev, `JOIN: ${participant.identity} vua vao phong`]);
        setParticipants(
          roomInstance.remoteParticipants
            ? Array.from(roomInstance.remoteParticipants.values()).map((item: any) => item.identity)
            : []
        );
      });

      roomInstance.on(lk.RoomEvent.ParticipantDisconnected, (participant) => {
        setLogs((prev) => [...prev, `LEAVE: ${participant.identity} da roi phong`]);
        setParticipants(
          roomInstance.remoteParticipants
            ? Array.from(roomInstance.remoteParticipants.values()).map((item: any) => item.identity)
            : []
        );
      });

      roomInstance.on(lk.RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        setLogs((prev) => [...prev, `AUDIO: Nhan track audio tu ${participant.identity}`]);
        if (track.kind === 'audio') {
          const element = track.attach();
          document.body.appendChild(element);
        }
      });

      roomInstance.on(lk.RoomEvent.Disconnected, () => {
        setLogs((prev) => [...prev, 'DISCONNECTED: Da ngat lien ket LiveKit']);
        setStatus('disconnected');
      });

      setRoom(roomInstance);
      await roomInstance.connect(data.url, data.token);
      setStatus('connected');
      setLogs((prev) => [...prev, 'READY: Da ket noi WebRTC thanh cong']);

      try {
        await roomInstance.localParticipant.setMicrophoneEnabled(true);
        setLogs((prev) => [...prev, 'MIC: Da kich hoat microphone']);
      } catch (micErr: any) {
        setLogs((prev) => [...prev, `WARNING: ${micErr.message}`]);
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setLogs((prev) => [...prev, `FATAL: ${err.message}`]);
    }
  };

  const endCall = () => {
    if (room) {
      try {
        room.disconnect();
      } catch (error) {
        console.warn(error);
      }
      setRoom(null);
    }
    setStatus('idle');
    setIsOpen(false);
    setParticipants([]);
    setTitle('');
    setSubtitle('');
  };

  return {
    endCall,
    isOpen,
    logs,
    participants,
    roomName,
    startCall,
    status,
    subtitle,
    title,
    token,
    url,
  };
}
