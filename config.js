// ====== Datos que pueden cambiar sin tocar el resto ======
window.CONFIG = {
  // Fecha y hora del baby shower (hora de Chile en diciembre = UTC-3)
  EVENTO: '2026-12-12T17:00:00-03:00',
  EVENTO_FIN: '2026-12-12T20:00:00-03:00',
  TITULO: 'Baby Shower de Santiago',
  LUGAR: 'El Roble 2171, Concepción, Chile',

  // "Ver ubicación"
  MAPA_URL: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('El Roble 2171, Concepción, Chile'),

  // "Ver lista de deseos"
  REGALOS_URL: 'https://happygiftlist.com/es/lista-de-deseos/k5hpeiam',

  // Confirmación por WhatsApp (número con código de país, sin + ni espacios)
  WHATSAPP: {
    Marcia: '56949046750',
    'Ángel': '56942038860',
  },

  // Archivo de calendario (iPhone y computador) con alertas el día del evento y 1 hora antes
  ICS: 'assets/babyshower-santiago.ics',
};
