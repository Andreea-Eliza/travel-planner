import { useState } from 'react';

const MONTH_NAMES = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sa', 'Du'];

const TRIP_COLORS = ['#7c5cfc', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

// Verifica daca o data e in intervalul unei calatorii
const isInTrip = (date, trip) => {
  const d = new Date(date).setHours(0, 0, 0, 0);
  const start = new Date(trip.startDate).setHours(0, 0, 0, 0);
  const end = new Date(trip.endDate).setHours(0, 0, 0, 0);
  return d >= start && d <= end;
};

const daysBetween = (date1, date2) => {
  const ms = new Date(date2).setHours(0, 0, 0, 0) - new Date(date1).setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

export default function CalendarPage({ trips, addTrip, deleteTrip }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({ name: '', destination: '', startDate: '', endDate: '' });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Genereaza zilele lunii curente (cu padding pentru zile din luna anterioara/urmatoare)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Luni = 0
  const daysInMonth = lastDay.getDate();

  const calendarDays = [];
  // Padding zile luna anterioara
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startWeekday - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
  }
  // Zile luna curenta
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
  }
  // Padding pana la 42 de celule (6 saptamani)
  let nextDay = 1;
  while (calendarDays.length < 42) {
    calendarDays.push({ day: nextDay, currentMonth: false, date: new Date(year, month + 1, nextDay) });
    nextDay++;
  }

  // Urmatoarea calatorie
  const upcomingTrips = trips
    .filter((t) => new Date(t.startDate) >= today)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const nextTrip = upcomingTrips[0];
  const daysUntilNext = nextTrip ? daysBetween(today, nextTrip.startDate) : null;

  const handleDayClick = (dayObj) => {
    if (!dayObj.currentMonth) return;
    const dateStr = dayObj.date.toISOString().split('T')[0];
    setSelectedDate(dayObj.date);
    setForm({ name: '', destination: '', startDate: dateStr, endDate: dateStr });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) return;
    addTrip({
      ...form,
      color: TRIP_COLORS[trips.length % TRIP_COLORS.length],
    });
    setShowModal(false);
    setForm({ name: '', destination: '', startDate: '', endDate: '' });
  };

  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="calendar-page">
      {/* Countdown widget */}
      {nextTrip && (
        <div className="countdown-widget">
          <div className="countdown-icon">✈️</div>
          <div className="countdown-info">
            <span className="countdown-label">Urmatoarea calatorie</span>
            <h2>{nextTrip.name}</h2>
            {nextTrip.destination && <p>{nextTrip.destination}</p>}
          </div>
          <div className="countdown-days">
            <span className="countdown-number">{daysUntilNext}</span>
            <span className="countdown-text">{daysUntilNext === 1 ? 'zi' : 'zile'}</span>
          </div>
        </div>
      )}

      {!nextTrip && (
        <div className="countdown-widget empty">
          <div className="countdown-icon">📅</div>
          <div className="countdown-info">
            <span className="countdown-label">Niciun plan inca</span>
            <h2>Planifica prima calatorie</h2>
            <p>Click pe o zi din calendar pentru a adauga o calatorie</p>
          </div>
        </div>
      )}

      <div className="calendar-grid-section">
        <div className="calendar-header">
          <h2>{MONTH_NAMES[month]} {year}</h2>
          <div className="calendar-nav">
            <button onClick={goToPrevMonth} className="cal-nav-btn">‹</button>
            <button onClick={goToToday} className="cal-today-btn">Azi</button>
            <button onClick={goToNextMonth} className="cal-nav-btn">›</button>
          </div>
        </div>

        <div className="calendar-grid">
          {DAY_NAMES.map((d) => (
            <div key={d} className="cal-day-name">{d}</div>
          ))}
          {calendarDays.map((dayObj, idx) => {
            const isToday = dayObj.date.getTime() === today.getTime();
            const dayTrips = trips.filter((t) => isInTrip(dayObj.date, t));
            return (
              <div
                key={idx}
                className={`cal-day ${dayObj.currentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''} ${dayTrips.length > 0 ? 'has-trip' : ''}`}
                onClick={() => handleDayClick(dayObj)}
              >
                <span className="cal-day-num">{dayObj.day}</span>
                <div className="cal-day-trips">
                  {dayTrips.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      className="cal-trip-bar"
                      style={{ backgroundColor: t.color }}
                      title={t.name}
                    >
                      {t.name}
                    </div>
                  ))}
                  {dayTrips.length > 2 && <div className="cal-more">+{dayTrips.length - 2}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista calatorii */}
      <div className="trips-list-section">
        <h2>Toate calatoriile</h2>
        {trips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🗓️</div>
            <h3>Nicio calatorie planificata</h3>
            <p>Click pe o zi din calendar pentru a adauga prima ta calatorie.</p>
          </div>
        ) : (
          <div className="trips-list">
            {[...trips]
              .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
              .map((t) => {
                const isPast = new Date(t.endDate) < today;
                const isOngoing = new Date(t.startDate) <= today && new Date(t.endDate) >= today;
                return (
                  <div key={t.id} className={`trip-card ${isPast ? 'past' : ''} ${isOngoing ? 'ongoing' : ''}`}>
                    <div className="trip-color" style={{ backgroundColor: t.color }}></div>
                    <div className="trip-card-info">
                      <div className="trip-card-header">
                        <h3>{t.name}</h3>
                        {isOngoing && <span className="trip-status ongoing">In desfasurare</span>}
                        {isPast && <span className="trip-status past">Trecuta</span>}
                      </div>
                      {t.destination && <p className="trip-card-dest">📍 {t.destination}</p>}
                      <p className="trip-card-dates">
                        {new Date(t.startDate).toLocaleDateString('ro-RO')} → {new Date(t.endDate).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                    <button onClick={() => deleteTrip(t.id)} className="btn-delete" title="Sterge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Modal adauga calatorie */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adauga calatorie</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body trip-form">
              <div className="trip-form-field">
                <label>Nume calatorie *</label>
                <input
                  type="text"
                  placeholder="Vacanta in Bali"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="trip-form-field">
                <label>Destinatie</label>
                <input
                  type="text"
                  placeholder="Bali, Indonezia"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                />
              </div>
              <div className="trip-form-row">
                <div className="trip-form-field">
                  <label>Data plecare *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="trip-form-field">
                  <label>Data intoarcere *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-add-trip">Adauga calatorie</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
