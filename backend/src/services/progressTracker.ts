interface ProgressState {
  username: string;
  stage: string;
  message: string;
  progress: number; // 0-100
  timestamp: number;
}

class ProgressTrackerService {
  private progressMap: Map<string, ProgressState> = new Map();

  setProgress(username: string, stage: string, message: string, progress: number) {
    this.progressMap.set(username, {
      username,
      stage,
      message,
      progress: Math.min(100, Math.max(0, progress)),
      timestamp: Date.now(),
    });
  }

  getProgress(username: string): ProgressState | null {
    const progress = this.progressMap.get(username);
    if (!progress) return null;
    
    // Clean up old progress (older than 5 minutes)
    if (Date.now() - progress.timestamp > 5 * 60 * 1000) {
      this.progressMap.delete(username);
      return null;
    }
    
    return progress;
  }

  clearProgress(username: string) {
    this.progressMap.delete(username);
  }
}

export const progressTracker = new ProgressTrackerService();



