export function getPromptCount() {
  const data = JSON.parse(localStorage.getItem('promptUsage') || '{}');
  const today = new Date().toISOString().slice(0, 10);
  return data[today] || 0;
}

export function incrementPromptCount() {
  const data = JSON.parse(localStorage.getItem('promptUsage') || '{}');
  const today = new Date().toISOString().slice(0, 10);
  data[today] = (data[today] || 0) + 1;
  localStorage.setItem('promptUsage', JSON.stringify(data));
}
