const STORAGE_KEY = 'daybook-events-v1';
const initialEvents = [
  { id: 'aice-associate', title: 'AICE Associate', date: '2026-10-30', note: '' },
  { id: 'hsk-5', title: 'HSK 5', date: '2026-11-07', note: '' }
];
const $ = (selector) => document.querySelector(selector);
const list = $('#event-list');
const form = $('#event-form');
let editingId = null;

function loadEvents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Correct the original sample date in existing browser data too.
        return parsed.map(event => ({ ...event, note: event.note || '', date: event.id === 'aice-associate' && event.date === '2026-10-20' ? '2026-10-30' : event.date }));
      }
    }
  } catch (error) { console.warn('일정을 불러오지 못했습니다.', error); }
  return initialEvents.map(event => ({ ...event }));
}
let events = loadEvents();
function saveEvents() { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); }
function dayGap(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(year, month - 1, day) - today) / 86400000);
}
function dateLabel(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일`;
}
function monthLabel(dateString) {
  const [year, month] = dateString.split('-').map(Number);
  return `${year}.${String(month).padStart(2, '0')}`;
}
function safe(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function resetForm() {
  editingId = null;
  form.reset();
  $('#form-heading').textContent = '어떤 날을 기다리고 있나요?';
  $('#submit-label').textContent = '일정 저장';
  $('#close-form').textContent = '×';
  form.classList.add('hidden');
}
function startEditing(id) {
  const event = events.find(item => item.id === id);
  if (!event) return;
  editingId = id;
  $('#event-name').value = event.title;
  $('#event-date').value = event.date;
  $('#event-note').value = event.note || '';
  $('#form-heading').textContent = '일정 내용을 수정해요';
  $('#submit-label').textContent = '수정 내용 저장';
  $('#close-form').textContent = '취소';
  form.classList.remove('hidden');
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('#event-name').focus();
}
function render() {
  const today = new Date();
  $('#today-date').textContent = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`;
  const sorted = [...events].sort((a,b) => a.date.localeCompare(b.date));
  const upcoming = sorted.find(event => dayGap(event.date) >= 0);
  $('#event-count').textContent = events.length;
  $('#next-title').textContent = upcoming ? upcoming.title : '예정된 일정이 없어요';
  $('#next-count').textContent = upcoming ? dayGap(upcoming.date) : '—';
  if (!sorted.length) {
    list.innerHTML = '<div class="empty"><strong>아직 등록한 일정이 없어요.</strong>일정 추가를 눌러 기다리는 날을 적어보세요.</div>';
    return;
  }
  list.innerHTML = sorted.map(event => {
    const gap = dayGap(event.date);
    const state = gap < 0 ? 'past' : gap === 0 ? 'today-count' : '';
    const count = gap < 0 ? `D+${Math.abs(gap)}` : gap === 0 ? 'D-DAY' : `D-${gap}`;
    return `<article class="event-card">
      <div class="date-tile"><span>${monthLabel(event.date)}</span><strong>${event.date.split('-')[2]}</strong></div>
      <div class="event-info"><h3>${safe(event.title)}</h3><p>${dateLabel(event.date)}${gap < 0 ? ' · 지난 일정' : ''}</p>${event.note ? `<p class="event-note">${safe(event.note).replace(/\n/g, '<br>')}</p>` : ''}</div>
      <div class="days ${state}"><strong>${count}</strong>${gap > 0 ? '<span>일 남음</span>' : ''}</div>
      <div class="card-actions"><button class="edit-button" data-edit="${safe(event.id)}" aria-label="${safe(event.title)} 일정 수정">수정</button><button class="delete-button" data-delete="${safe(event.id)}" aria-label="${safe(event.title)} 일정 삭제" title="일정 삭제">×</button></div>
    </article>`;
  }).join('');
}
$('#open-form').addEventListener('click', () => { resetForm(); form.classList.remove('hidden'); $('#event-name').focus(); });
$('#close-form').addEventListener('click', resetForm);
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = $('#event-name').value.trim();
  const date = $('#event-date').value;
  const note = $('#event-note').value.trim().slice(0, 240);
  if (!title || !date) return;
  if (editingId) {
    events = events.map(event => event.id === editingId ? { ...event, title, date, note } : event);
  } else {
    events.push({ id: (crypto.randomUUID ? crypto.randomUUID() : ('event-' + Date.now() + '-' + Math.random().toString(16).slice(2))), title, date, note });
  }
  saveEvents(); render(); resetForm();
});
list.addEventListener('click', (e) => {
  const editButton = e.target.closest('[data-edit]');
  if (editButton) { startEditing(editButton.dataset.edit); return; }
  const deleteButton = e.target.closest('[data-delete]');
  if (!deleteButton) return;
  events = events.filter(event => event.id !== deleteButton.dataset.delete);
  saveEvents(); render();
});
render();


