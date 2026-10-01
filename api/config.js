// Espone al frontend solo la chiave "browser" per il rendering della mappa
// (Maps JavaScript API). Questa chiave è per natura visibile lato client:
// va protetta restringendola per dominio (HTTP referrer) in Google Cloud Console.
// La chiave Distance Matrix dell'utente non passa MAI da qui: vive cifrata
// in un cookie httpOnly, letto solo da api/distance-matrix.js.

module.exports = (req, res) => {
  res.status(200).json({
    mapsApiKey: process.env.GOOGLE_MAPS_BROWSER_KEY || null
  });
};
