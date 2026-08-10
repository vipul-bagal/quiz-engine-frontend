import { useCallback, useEffect, useRef, useState } from 'react';
import { getActiveGenerationJobs } from '../api/questions';

const POLL_INTERVAL_MS = 3000;

/**
 * Polls for the instructor's active generation job. Returns { activeJob,
 * checked, refresh } — checked is false only during the very first check,
 * so callers can avoid a flash of unlocked content before the first poll
 * resolves. refresh() lets a caller (e.g. after cancelling a job) force an
 * immediate re-check instead of waiting for the next scheduled poll.
 */
export default function useGenerationLock() {
  const [activeJob, setActiveJob] = useState(null);
  const [checked, setChecked] = useState(false);
  const cancelledRef = useRef(false);

  const poll = useCallback(async () => {
    try {
      const jobs = await getActiveGenerationJobs();
      if (!cancelledRef.current) {
        setActiveJob(jobs.length > 0 ? jobs[0] : null);
        setChecked(true);
      }
    } catch {
      if (!cancelledRef.current) setChecked(true);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => { cancelledRef.current = true; clearInterval(intervalId); };
  }, [poll]);

  return { activeJob, checked, refresh: poll };
}
