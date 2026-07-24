import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Button, Card, Input, Spinner } from '../../components/ui';
import QuestionTile from '../../components/QuestionTile';
import { getMyQuestions, getQuestionsByCourse, deleteQuestion } from '../../api/questions';

export default function MyQuestions() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState(null);
  const [courseFilter, setCourseFilter] = useState(searchParams.get('course') || '');
  const [filteredList, setFilteredList] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPage = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const data = await getMyQuestions({ page: pageNum, size: 10 });
      setPageData(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const runCourseFilter = useCallback(async (course) => {
    if (!course.trim()) {
      setFilteredList(null);
      loadPage(0);
      return;
    }
    setLoading(true);
    try {
      const data = await getQuestionsByCourse(course.trim());
      setFilteredList(data);
    } finally {
      setLoading(false);
    }
  }, [loadPage]);

  useEffect(() => {
    if (courseFilter) runCourseFilter(courseFilter);
    else loadPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (searchParams.get('course')) runCourseFilter(searchParams.get('course'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterSubmit(e) {
    e.preventDefault();
    runCourseFilter(courseFilter);
  }

  function clearFilter() {
    setCourseFilter('');
    setFilteredList(null);
    setPage(0);
    loadPage(0);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    try {
      await deleteQuestion(id);
      if (filteredList) setFilteredList(filteredList.filter((q) => q.id !== id));
      else loadPage(page);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete question.');
    }
  }

  function handleUpdated(updated) {
    if (filteredList) setFilteredList(filteredList.map((q) => (q.id === updated.id ? updated : q)));
    else loadPage(page);
  }

  const questions = filteredList ?? pageData?.content ?? [];

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">My questions</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Review, edit, or remove questions you've generated. Hover a question to see its options.</p>

      <form onSubmit={handleFilterSubmit} className="flex items-end gap-3 mb-6">
        <div className="flex-1 max-w-xs">
          <Input label="Filter by course ID" placeholder="e.g. psych-101" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} />
        </div>
        <Button type="submit" variant="secondary">Filter</Button>
        {filteredList && (
          <Button type="button" variant="ghost" onClick={clearFilter}>
            <X size={14} /> Clear
          </Button>
        )}
      </form>

      {loading && <div className="flex justify-center py-12"><Spinner /></div>}

      {!loading && questions.length === 0 && (
        <Card><p className="text-sm text-[var(--color-text-muted)]">No questions found{filteredList ? ' for that course' : ''}.</p></Card>
      )}

      {!loading && questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionTile key={q.id} question={q} onUpdated={handleUpdated} onDeleted={handleDelete} />
          ))}
        </div>
      )}

      {!filteredList && pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="secondary" disabled={pageData.first} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={15} /></Button>
          <span className="text-sm text-[var(--color-text-muted)] font-mono">{pageData.number + 1} / {pageData.totalPages}</span>
          <Button variant="secondary" disabled={pageData.last} onClick={() => setPage((p) => p + 1)}><ChevronRight size={15} /></Button>
        </div>
      )}
    </DashboardShell>
  );
}
