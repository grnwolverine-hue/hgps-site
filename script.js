/* Highground Property Services -- shared prototype state helpers.
   Uses localStorage so selections on the request form carry through
   to the booking page, the confirmation page, and the client portal. */

const HGPS_KEY = 'hgps_booking';

function hgpsGetBooking(){
  try{
    const raw = localStorage.getItem(HGPS_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){
    return {};
  }
}

function hgpsSaveBooking(partial){
  const current = hgpsGetBooking();
  const merged = Object.assign({}, current, partial);
  localStorage.setItem(HGPS_KEY, JSON.stringify(merged));
  return merged;
}

function hgpsClearBooking(){
  localStorage.removeItem(HGPS_KEY);
}

/* Collect checked service checkboxes from a form into an array of labels */
function hgpsCollectServices(formEl){
  return Array.from(formEl.querySelectorAll('input[type="checkbox"][name="service"]:checked'))
    .map(cb => cb.value);
}

/* Wire a request form (residential or commercial) to save state and
   navigate to the given booking page on submit. */
function hgpsInitRequestForm(formEl, path, bookingPageUrl){
  formEl.addEventListener('submit', function(e){
    e.preventDefault();
    const services = hgpsCollectServices(formEl);
    const data = { path: path, services: services, slot: null };
    formEl.querySelectorAll('input[type="text"],input[type="tel"],textarea').forEach(el => {
      if(el.name) data[el.name] = el.value;
    });
    formEl.querySelectorAll('select').forEach(el => {
      if(el.name) data[el.name] = el.value;
    });
    hgpsSaveBooking(data);
    window.location.href = bookingPageUrl;
  });
}

/* Wire up the weekly slot picker. Booked slots (class "booked") are inert.
   Clicking an available slot marks it selected and enables the submit button. */
function hgpsInitSlotPicker(gridSelector, continueBtnSelector){
  const grid = document.querySelector(gridSelector);
  const btn = document.querySelector(continueBtnSelector);
  if(!grid) return;
  const slots = grid.querySelectorAll('.slot-btn:not(.booked)');
  slots.forEach(s => {
    s.addEventListener('click', function(){
      grid.querySelectorAll('.slot-btn.selected').forEach(x => x.classList.remove('selected'));
      s.classList.add('selected');
      if(btn) btn.disabled = false;
      hgpsSaveBooking({ slotDay: s.dataset.day, slotTime: s.dataset.time });
    });
  });
  // restore prior selection if present
  const existing = hgpsGetBooking();
  if(existing.slotDay && existing.slotTime){
    const match = Array.from(slots).find(s => s.dataset.day === existing.slotDay && s.dataset.time === existing.slotTime);
    if(match){
      match.classList.add('selected');
      if(btn) btn.disabled = false;
    }
  }
}

function hgpsFormatServices(list){
  if(!list || !list.length) return 'No services selected';
  return list.join(', ');
}

/* Populate any element with data-hgps="field" using the saved booking state */
function hgpsRenderBindings(){
  const data = hgpsGetBooking();
  document.querySelectorAll('[data-hgps]').forEach(el => {
    const key = el.getAttribute('data-hgps');
    if(key === 'services'){
      el.textContent = hgpsFormatServices(data.services);
    } else if(key === 'slot'){
      el.textContent = (data.slotDay && data.slotTime) ? (data.slotDay + ', ' + data.slotTime) : 'No slot selected';
    } else if(data[key]){
      el.textContent = data[key];
    }
  });
}

document.addEventListener('DOMContentLoaded', hgpsRenderBindings);