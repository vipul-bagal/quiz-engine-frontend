import client from './client';

export async function getAllStudents() {
  const { data } = await client.get('/users/students');
  return data;
}

export async function createStudent({ email, password, firstName, lastName }) {
  const { data } = await client.post('/users/students', { email, password, firstName, lastName });
  return data;
}

export async function setStudentActive(studentId, active) {
  const { data } = await client.patch(`/users/students/${studentId}/status`, { active });
  return data;
}

export async function deleteStudent(studentId) {
  const { data } = await client.delete(`/users/students/${studentId}`);
  return data;
}

export async function getAllInstructors() {
  const { data } = await client.get('/users/instructors');
  return data;
}
