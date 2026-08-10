import client from './client';

export async function getApprovalsSummary() {
  const { data } = await client.get('/approvals/summary');
  return data;
}
