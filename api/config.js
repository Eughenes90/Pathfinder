// Espone al frontend la chiave Carto Basemaps (pensata per stare nell'URL dei
// tile, lato browser — stesso livello di esposizione della vecchia chiave
// Maps "browser" di Google). Il calcolo dei percorsi resta indipendente da
// questa chiave: serve solo per disegnare i tile della mappa, non è coinvolta
// in nessun calcolo.

module.exports = (req, res) => {
  res.status(200).json({
    cartoApiKey: process.env.CARTO_API_KEY || null
  });
};
