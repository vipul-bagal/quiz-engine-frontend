import client from './client';

// Instructor-facing: every material on a quiz they can edit, regardless of
// student-visibility — the management view.
export async function getMaterialsForInstructor(questionSetId) {
  const { data } = await client.get(`/quiz-materials/quiz/${questionSetId}`);
  return data;
}

// Student-facing: only materials the instructor has made visible.
export async function getMaterialsForStudent(questionSetId) {
  const { data } = await client.get(`/quiz-materials/quiz/${questionSetId}/student-view`);
  return data;
}

export async function uploadSupplementaryMaterial(questionSetId, file, { studentVisible = false, downloadable = false } = {}) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post(
    `/quiz-materials/quiz/${questionSetId}/supplementary?studentVisible=${studentVisible}&downloadable=${downloadable}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

export async function updateMaterialVisibility(materialId, { studentVisible, downloadable }) {
  const body = {};
  if (studentVisible !== undefined) body.studentVisible = studentVisible;
  if (downloadable !== undefined) body.downloadable = downloadable;
  const { data } = await client.patch(`/quiz-materials/${materialId}/visibility`, body);
  return data;
}

export async function deleteMaterial(materialId) {
  const { data } = await client.delete(`/quiz-materials/${materialId}`);
  return data;
}

// Convenience for the results page, which only has a sessionId.
export async function getMaterialsForSession(sessionId) {
  const { data } = await client.get(`/quiz-materials/session/${sessionId}/student-view`);
  return data;
}

export async function getQuestionImageUrl(questionId) {
  const { data } = await client.get(`/questions/${questionId}/image-url`);
  return data.url;
}
