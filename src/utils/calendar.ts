export interface CalendarEventData {
  title: string;
  description: string;
  location: string;
  startDateUTC: string; // ISO format
  endDateUTC: string;   // ISO format
  url?: string;
}

export const LAUNCH_EVENT: CalendarEventData = {
  title: 'UP N DOWN — Official Streetwear Launch (Drop 01)',
  description: 'Exclusive luxury streetwear collection drop for UP N DOWN. SAME ENERGY DIFFERENT PHASE. Launching on 31st Dec 2026. Collection roster: UP N DOWN Baseball Cap, Architectural Denim Loose Pant, and Heavy Tees. Strictly 100 slots only. Verified Club Pass holders receive private 2-hour advance allocation window. Instagram: @upndown.ofc · Official Mail: upndownofficialstore@gmail.com',
  location: 'https://upndown.com',
  // 18:00 IST is 12:30:00 UTC
  startDateUTC: '2026-12-31T12:30:00Z',
  endDateUTC: '2026-12-31T14:30:00Z',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://upndown.com',
};

/**
 * Formats a Date/ISO string to YYYYMMDDTHHMMSSZ for iCal / Google Calendar
 */
function formatToICSDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generates a direct Google Calendar creation URL
 */
export function createGoogleCalendarUrl(event: CalendarEventData = LAUNCH_EVENT): string {
  const start = formatToICSDate(event.startDateUTC);
  const end = formatToICSDate(event.endDateUTC);
  const details = encodeURIComponent(`${event.description}\n\nOfficial Website: ${event.url || event.location}\nInstagram: @upndown.ofc\nOfficial Store Mail: upndownofficialstore@gmail.com`);
  const title = encodeURIComponent(event.title);
  const location = encodeURIComponent(event.location);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

/**
 * Generates a direct Outlook.com Web Calendar creation URL
 */
export function createOutlookWebCalendarUrl(event: CalendarEventData = LAUNCH_EVENT): string {
  const start = new Date(event.startDateUTC).toISOString();
  const end = new Date(event.endDateUTC).toISOString();
  const subject = encodeURIComponent(event.title);
  const body = encodeURIComponent(`${event.description}\n\n${event.url || event.location}\nInstagram: @upndown.ofc\nOfficial Store Mail: upndownofficialstore@gmail.com`);
  const location = encodeURIComponent(event.location);

  return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${subject}&startdt=${start}&enddt=${end}&body=${body}&location=${location}`;
}

/**
 * Generates complete iCalendar (.ics) format file string
 */
export function createICSString(event: CalendarEventData = LAUNCH_EVENT): string {
  const start = formatToICSDate(event.startDateUTC);
  const end = formatToICSDate(event.endDateUTC);
  const now = formatToICSDate(new Date().toISOString());

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UP N DOWN//STREETWEAR DROP 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:upndown-drop001-20261117@upndownofficialstore.com`,
    'ORGANIZER;CN=UP N DOWN Official Store:mailto:upndownofficialstore@gmail.com',
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    `URL:${event.url || event.location}`,
    'STATUS:CONFIRMED',
    // 2-hour advance reminder alarm
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: UP N DOWN Drop opens in 2 hours for Club Pass holders!',
    'END:VALARM',
    // 15-minute advance reminder alarm
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: UP N DOWN Drop opens in 15 minutes! SAME ENERGY DIFFERENT PHASE.',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Initiates download of the .ics file for Apple Calendar, Outlook, and desktop systems
 */
export function downloadICSFile(event: CalendarEventData = LAUNCH_EVENT, filename = 'UP_N_DOWN_LAUNCH_NOV17.ics'): void {
  const icsData = createICSString(event);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
