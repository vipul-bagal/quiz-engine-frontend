import client from './client';

// Kicks off generation as a background job — returns immediately (202) with
// the job DTO. Generation keeps running server-side regardless of navigation.
// Accepts MULTIPLE files (a whole module's worth of material), a total
// question target, and variantsPerConcept. Picture questions are always
// attempted automatically when a suitable image exists — no toggle needed.
export async function generateQuestions({ files, courseId, courseContext, variantsPerConcept, totalQuestionsRequested, difficulty }) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('courseId', courseId);
  formData.append('courseContext', courseContext);
  formData.append('variantsPerConcept', variantsPerConcept);
  formData.append('totalQuestionsRequested', totalQuestionsRequested);
  formData.append('difficulty', difficulty);

  const { data } = await client.post('/questions/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data; // GenerationJobDTO
}

export async function cancelGenerationJob(jobId) {
  const { data } = await client.post(`/questions/generate-jobs/${jobId}/cancel`);
  return data;
}

export async function getActiveGenerationJobs() {
  const { data } = await client.get('/questions/generate-jobs/active');
  return data;
}

export async function getGenerationJob(jobId) {
  const { data } = await client.get(`/questions/generate-jobs/${jobId}`);
  return data;
}

// Recovery path — job completed but materials failed to attach afterward.
// Re-upload the exact same files (matched server-side by original filename).
export async function reattachGenerationMaterials(jobId, files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const { data } = await client.post(`/questions/generate-jobs/${jobId}/reattach-materials`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// Instructor-authored question — always source = MANUAL, so it stays
// editable AND deletable, unlike AI-generated content.
export async function createManualQuestion(payload) {
  const { data } = await client.post('/questions/manual', payload);
  return data;
}

export async function updateQuestion(id, payload) {
  const { data } = await client.put(`/questions/${id}`, payload);
  return data;
}

// Attach or replace a question's image — works for both AI-generated and
// manually created questions, so an instructor can fix a wrongly-picked
// AI image or add one to their own question.
export async function uploadQuestionImage(questionId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post(`/questions/${questionId}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteQuestionImage(questionId) {
  const { data } = await client.delete(`/questions/${questionId}/image`);
  return data;
}

export async function deleteQuestion(id) {
  const { data } = await client.delete(`/questions/${id}`);
  return data;
}
