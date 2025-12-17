// Utility for managing saved jobs and gigs

export interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  posted: string;
  description: string;
  tags: string[];
  matchScore?: number;
  savedAt: string;
}

export interface SavedGig {
  id: string;
  title: string;
  client: string;
  location: string;
  rate: string;
  duration: string;
  posted: string;
  description: string;
  tags: string[];
  matchScore?: number;
  proposals?: number;
  savedAt: string;
}

const SAVED_JOBS_KEY = "powr_saved_jobs";
const SAVED_GIGS_KEY = "powr_saved_gigs";

export const savedItems = {
  // Jobs
  getSavedJobs(): SavedJob[] {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(SAVED_JOBS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  saveJob(job: Omit<SavedJob, "savedAt">): void {
    const saved = this.getSavedJobs();
    if (!saved.find((j) => j.id === job.id)) {
      saved.push({ ...job, savedAt: new Date().toISOString() });
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(saved));
    }
  },

  unsaveJob(jobId: string): void {
    const saved = this.getSavedJobs();
    const filtered = saved.filter((j) => j.id !== jobId);
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(filtered));
  },

  isJobSaved(jobId: string): boolean {
    return this.getSavedJobs().some((j) => j.id === jobId);
  },

  // Gigs
  getSavedGigs(): SavedGig[] {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(SAVED_GIGS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  saveGig(gig: Omit<SavedGig, "savedAt">): void {
    const saved = this.getSavedGigs();
    if (!saved.find((g) => g.id === gig.id)) {
      saved.push({ ...gig, savedAt: new Date().toISOString() });
      localStorage.setItem(SAVED_GIGS_KEY, JSON.stringify(saved));
    }
  },

  unsaveGig(gigId: string): void {
    const saved = this.getSavedGigs();
    const filtered = saved.filter((g) => g.id !== gigId);
    localStorage.setItem(SAVED_GIGS_KEY, JSON.stringify(filtered));
  },

  isGigSaved(gigId: string): boolean {
    return this.getSavedGigs().some((g) => g.id === gigId);
  },
};


