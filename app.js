const STORAGE_KEY = 'daybook-events-v1';
const initialEvents = [
  { id: 'aice-associate', title: 'AICE Associate', date: '2026-10-20' },
  { id: 'hsk-5', title: 'HSK 5', date: '2026-11-07' }
];
const $ = (selector) => document.querySelector(selector);
const list = $('#event-list');
const form = $('#event-form');
function loadEvents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return JSON.parse(saved);
  } catch (error) { console.warn('일정을 불러오지 못했습니다.', error); }
  return initialEvents.map(event => ({...event}));
}
let events = loadEvents();
function saveEvents() { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); }
function dayGap(dateString) {
  const [year, month, day] = dateString.split('-').map(Number), now = new Date();
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
}
function dateLabel(value) { const [y,m,d]=value.split('-').map(Number); return `${y}년 ${m}월 ${d}일`; }
function monthLabel(value) { const [y,m]=value.split('-').map(Number); return `${y}.${String(m).padStart(2,'0')}`; }
function safe(value='') { return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function render() {
  const now=new Date(); $('#today-date').textContent=`${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
  const sorted=[...events].sort((a,b)=>a.date.localeCompare(b.date)), next=sorted.find(e=>dayGap(e.date)>=0);
  $('#event-count').textContent=events.length; $('#next-title').textContent=next?next.title:'예정된 일정이 없어요'; $('#next-count').textContent=next?dayGap(next.date):'—';
  if(!sorted.length){list.innerHTML='<div class="empty"><strong>아직 등록한 일정이 없어요.</strong>일정 추가를 눌러 기다리는 날을 적어보세요.</div>';return;}
  list.innerHTML=sorted.map(e=>{const gap=dayGap(e.date),state=gap<0?'past':gap===0?'today-count':'',count=gap<0?`D+${-gap}`:gap===0?'D-DAY':`D-${gap}`;
    return `<article class="event-card"><div class="date-tile"><span>${monthLabel(e.date)}</span><strong>${e.date.split('-')[2]}</strong></div><div class="event-info"><h3>${safe(e.title)}</h3><p>${dateLabel(e.date)}${gap<0?' · 지난 일정':''}</p></div><div class="days ${state}"><strong>${count}</strong>${gap>0?'<span>일 남음</span>':''}</div><button class="delete-button" data-delete="${safe(e.id)}" aria-label="${safe(e.title)} 일정 삭제">×</button></article>`;
  }).join('');
}
$('#open-form').addEventListener('click',()=>{form.classList.remove('hidden');$('#event-name').focus();});
$('#close-form').addEventListener('click',()=>form.classList.add('hidden'));
form.addEventListener('submit',e=>{e.preventDefault();const title=$('#event-name').value.trim(),date=$('#event-date').value;if(!title||!date)return;events.push({id:(crypto.randomUUID ? crypto.randomUUID() : ('event-' + Date.now() + '-' + Math.random().toString(16).slice(2))),title,date});saveEvents();render();form.reset();form.classList.add('hidden');});
list.addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(!b)return;events=events.filter(item=>item.id!==b.dataset.delete);saveEvents();render();});
render();


