import useGenerationLock from './useGenerationLock';
import GenerationLockScreen from './GenerationLockScreen';

/**
 * Wraps a page's normal content. While the instructor has any active
 * generation job, shows the lock screen instead of children entirely.
 */
export default function GenerationLockGate({ courses, children }) {
  const { activeJob, checked, refresh } = useGenerationLock();

  if (!checked) return null;
  if (activeJob) return <GenerationLockScreen activeJob={activeJob} courses={courses} onCancelled={refresh} />;
  return children;
}
