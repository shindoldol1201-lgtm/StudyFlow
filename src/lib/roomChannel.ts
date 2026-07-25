// Helper for reliable cross-tab / cross-window real-time room communication & state sync
export interface SyncMessage {
  type: 'STUDENT_SYNC' | 'STUDENT_LEAVE' | 'TEACHER_KICK' | 'TEACHER_UNKICK' | 'TEACHER_MESSAGE' | 'TEACHER_TIMER';
  roomCode: string;
  studentId?: string;
  student?: any;
  message?: string;
  targetStudyMinutes?: number;
  breakMinutes?: number;
  timerRunning?: boolean;
  timestamp: number;
}

class RoomChannelManager {
  private channels: Record<string, BroadcastChannel> = {};
  private listeners: Record<string, Set<(msg: SyncMessage) => void>> = {};

  private getChannel(roomCode: string): BroadcastChannel | null {
    const cleanCode = (roomCode || 'ROOM-3A1').toUpperCase().trim().replace(/\s+/g, '');
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return null;
    }
    if (!this.channels[cleanCode]) {
      try {
        const channel = new BroadcastChannel(`studyflow_channel_${cleanCode}`);
        channel.onmessage = (event) => {
          this.notify(cleanCode, event.data);
        };
        this.channels[cleanCode] = channel;
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
    return this.channels[cleanCode] || null;
  }

  public subscribe(roomCode: string, callback: (msg: SyncMessage) => void) {
    const cleanCode = (roomCode || 'ROOM-3A1').toUpperCase().trim().replace(/\s+/g, '');
    if (!this.listeners[cleanCode]) {
      this.listeners[cleanCode] = new Set();
    }
    this.listeners[cleanCode].add(callback);

    // Initialize broadcast channel if available
    this.getChannel(cleanCode);

    // Fallback: Listen to localStorage storage events
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `studyflow_msg_${cleanCode}` && e.newValue) {
        try {
          const msg: SyncMessage = JSON.parse(e.newValue);
          this.notify(cleanCode, msg);
        } catch (err) {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (this.listeners[cleanCode]) {
        this.listeners[cleanCode].delete(callback);
      }
      window.removeEventListener('storage', handleStorage);
    };
  }

  private notify(roomCode: string, msg: SyncMessage) {
    const cleanCode = (roomCode || 'ROOM-3A1').toUpperCase().trim().replace(/\s+/g, '');
    if (this.listeners[cleanCode]) {
      this.listeners[cleanCode].forEach((cb) => {
        try {
          cb(msg);
        } catch (err) {
          console.error(err);
        }
      });
    }
  }

  public broadcast(msg: SyncMessage) {
    const cleanCode = (msg.roomCode || 'ROOM-3A1').toUpperCase().trim().replace(/\s+/g, '');
    const fullMsg: SyncMessage = { ...msg, roomCode: cleanCode, timestamp: Date.now() };

    // 1. BroadcastChannel
    const channel = this.getChannel(cleanCode);
    if (channel) {
      try {
        channel.postMessage(fullMsg);
      } catch (e) {
        console.warn(e);
      }
    }

    // 2. LocalStorage Event fallback (for cross-window on same domain)
    try {
      localStorage.setItem(`studyflow_msg_${cleanCode}`, JSON.stringify(fullMsg));
    } catch (e) {
      // ignore
    }

    // 3. Notify local listeners in same tab
    this.notify(cleanCode, fullMsg);
  }
}

export const roomChannel = new RoomChannelManager();
